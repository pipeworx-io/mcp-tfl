# mcp-tfl

Transport for London (TfL) Unified API MCP — keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/tfl/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Tfl data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
