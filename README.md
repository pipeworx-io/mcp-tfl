# mcp-tfl

Transport for London (TfL) Unified API MCP — keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `line_status` | Current service status for London transport lines. Pass either a comma-separated list of modes (e.g. "tube,dlr") OR a specific lineId (e.g. "victoria", "central"). Returns each line with lineStatuses + statusSeverityDescription (e.g. "Good Service", "Minor Delays"). |
| `stop_search` | Search for stops/stations by name. Returns matches with a naptanId (the "id" field) used by the arrivals tool, plus modes, zone, and lat/lon. |
| `arrivals` | Real-time predicted arrivals at a stop. Pass the naptanId from stop_search (e.g. "940GZZLUOXC"). Results are sorted by timeToStation (seconds away), nearest first. |
| `plan_journey` | Plan a journey across London transport. from/to may be stop names, postcodes, or "lat,lon" coordinates. Returns journey options (legs, durations, modes). If a location is ambiguous, the API returns disambiguation options instead of journeys — refine the input or use a naptanId/coords. |
| `bike_points` | London Santander Cycle hire scheme — live pushbike and empty-dock counts at each London cycle-hire docking point (bikes available, spaces free, total capacity in additionalProperties). London public bicycle rental only. Pass an optional area filter, e.g. "Clerkenwell"; omit for all London cycle docks. |
| `disruptions` | Current disruptions for the given transport modes, with description and affected lines. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tfl": {
      "url": "https://gateway.pipeworx.io/tfl/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tfl data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
