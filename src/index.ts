interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Transport for London (TfL) Unified API MCP — keyless.
 *
 * Live London transport: line status, stop search, real-time arrivals,
 * journey planning, Santander cycle docking, and disruptions.
 *
 * No app key required for moderate use. modes are comma-separated, drawn from:
 *   tube, dlr, overground, elizabeth-line, bus, tram, national-rail.
 * naptanId values come from `stop_search`. Journey from/to accept stop names,
 * postcodes, or "lat,lon" coordinates.
 */


const BASE = 'https://api.tfl.gov.uk';
const UA = 'pipeworx-mcp-tfl/1.0 (+https://pipeworx.io)';

const MODES_DESC =
  'Comma-separated transport modes: tube, dlr, overground, elizabeth-line, bus, tram, national-rail.';

const tools: McpToolExport['tools'] = [
  {
    name: 'line_status',
    description:
      'Current service status for London transport lines. Pass either a comma-separated list of modes (e.g. "tube,dlr") OR a specific lineId (e.g. "victoria", "central"). Returns each line with lineStatuses + statusSeverityDescription (e.g. "Good Service", "Minor Delays").',
    inputSchema: {
      type: 'object',
      properties: {
        modes: { type: 'string', description: MODES_DESC + ' Used when lineId is not given.' },
        lineId: { type: 'string', description: 'Specific line id, e.g. "victoria", "central", "elizabeth". Takes precedence over modes.' },
      },
    },
  },
  {
    name: 'stop_search',
    description:
      'Search for stops/stations by name. Returns matches with a naptanId (the "id" field) used by the arrivals tool, plus modes, zone, and lat/lon.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Stop/station name to search for, e.g. "Oxford Circus".' },
        modes: { type: 'string', description: 'Optional filter. ' + MODES_DESC },
      },
      required: ['query'],
    },
  },
  {
    name: 'arrivals',
    description:
      'Real-time predicted arrivals at a stop. Pass the naptanId from stop_search (e.g. "940GZZLUOXC"). Results are sorted by timeToStation (seconds away), nearest first.',
    inputSchema: {
      type: 'object',
      properties: {
        naptanId: { type: 'string', description: 'Stop NaPTAN id, obtained from stop_search.' },
      },
      required: ['naptanId'],
    },
  },
  {
    name: 'plan_journey',
    description:
      'Plan a journey across London transport. from/to may be stop names, postcodes, or "lat,lon" coordinates. Returns journey options (legs, durations, modes). If a location is ambiguous, the API returns disambiguation options instead of journeys — refine the input or use a naptanId/coords.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Origin: stop name, postcode, or "lat,lon".' },
        to: { type: 'string', description: 'Destination: stop name, postcode, or "lat,lon".' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'bike_points',
    description:
      'Santander Cycle docking stations with live availability (bikes, empty docks, total docks in additionalProperties). Pass an optional search to filter by name/area; omit it to list all docking stations.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/area filter, e.g. "Clerkenwell". Omit for all docks.' },
      },
    },
  },
  {
    name: 'disruptions',
    description:
      'Current disruptions for the given transport modes, with description and affected lines.',
    inputSchema: {
      type: 'object',
      properties: {
        modes: { type: 'string', description: MODES_DESC + ' Defaults to "tube".' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'line_status': {
      const lineId = (args.lineId as string | undefined)?.trim();
      if (lineId) return tflGet(`/Line/${enc(lineId)}/Status`);
      const modes = (args.modes as string | undefined)?.trim();
      if (!modes) throw new Error('Provide either "lineId" (e.g. "victoria") or "modes" (e.g. "tube,dlr").');
      return tflGet(`/Line/Mode/${enc(modes)}/Status`);
    }
    case 'stop_search': {
      const query = reqStr(args, 'query', '"Oxford Circus"');
      const modes = (args.modes as string | undefined)?.trim();
      const qs = modes ? `?modes=${enc(modes)}` : '';
      return tflGet(`/StopPoint/Search/${enc(query)}${qs}`);
    }
    case 'arrivals': {
      const naptanId = reqStr(args, 'naptanId', '"940GZZLUOXC" (from stop_search)');
      return tflGet(`/StopPoint/${enc(naptanId)}/Arrivals`);
    }
    case 'plan_journey': {
      const from = reqStr(args, 'from', '"Oxford Circus" or "51.5152,-0.1419"');
      const to = reqStr(args, 'to', '"Victoria" or "SW1A 1AA"');
      // Journey planner returns HTTP 300 (disambiguation) for ambiguous locations;
      // that body is useful, so accept it alongside 200.
      return tflGet(`/Journey/JourneyResults/${enc(from)}/to/${enc(to)}`, [300]);
    }
    case 'bike_points': {
      const search = (args.search as string | undefined)?.trim();
      return tflGet(search ? `/BikePoint/Search?query=${enc(search)}` : '/BikePoint');
    }
    case 'disruptions': {
      const modes = (args.modes as string | undefined)?.trim() || 'tube';
      return tflGet(`/Line/Mode/${enc(modes)}/Disruption`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function tflGet(path: string, alsoOk: number[] = []): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok && !alsoOk.includes(res.status)) {
    throw new Error(`TfL: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  return res.json();
}

function enc(s: string): string {
  return encodeURIComponent(s);
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
