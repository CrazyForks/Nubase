# Nubase MCP and Agent Guide

Nubase exposes an MCP server for trusted AI coding agents. Agents use it to inspect schema, run controlled database operations, and work with durable Memory.

## Endpoint

Default local endpoint:

```text
http://localhost:9999/mcp
```

Most requests need:

```http
apikey: <project anon/authenticated/service_role key>
Authorization: Bearer <user JWT>
```

`Authorization` is optional for service-role workflows, but user-scoped Memory and RLS behavior should use a user JWT when available.

## Agent Metadata

Agents and setup UIs can discover Nubase capabilities through:

```text
GET /agent/v1/instructions
GET /agent/v1/capabilities
```

These endpoints intentionally do not return secrets.

## Database Tools

Existing database MCP tools:

- `listTables(schemas)`: list tables, columns, primary keys, and foreign keys.
- `getTableStructure(tableName, schema)`: inspect one table in detail.
- `exportRlsPolicies(schemaName, tableNames, includeDropStatements, groupBySchema)`: export RLS policies.
- `executeSql(sqlQuery)`: execute raw SQL.
- `initDatabase()`: initialize the current project database.

`executeSql` is powerful. Only expose it in trusted local or server-side environments.

## Memory Tools

Memory MCP tools:

- `fetch_docs(topic)`: fetch bundled Nubase usage docs for agents.
- `memorySearch(userId, agentId, runId, query, topK)`: search durable Memory.
- `memoryWrite(userId, agentId, runId, content, infer)`: write durable Memory.
- `memoryContext(userId, agentId, runId, task, topK)`: return compact task context plus structured memory hits.

Example:

```json
{
  "tool": "memoryContext",
  "arguments": {
    "agentId": "codex",
    "task": "Implement billing settings page"
  }
}
```

Write a project decision:

```json
{
  "tool": "memoryWrite",
  "arguments": {
    "agentId": "claude-code",
    "content": "Project convention: service role keys must never be placed in generated frontend code.",
    "infer": true
  }
}
```

## Risk Levels

Recommended client behavior:

- `read`: schema inspection, Memory search, capability discovery.
- `write_safe`: Memory write, creating test data.
- `write_schema`: table, index, policy, or migration changes.
- `dangerous`: `drop`, `truncate`, bulk delete, reset, or destructive admin actions.

Agents should call a dry-run or ask for confirmation before dangerous operations. Nubase will add explicit SQL risk classification and audit records in the Agent Enablement roadmap.

## Connect Examples

Generic MCP config shape:

```json
{
  "mcpServers": {
    "nubase": {
      "command": "npx",
      "args": ["nubase_cli"],
      "env": {
        "NUBASE_URL": "http://localhost:9999",
        "NUBASE_PROJECT_KEY": "YOUR_NUBASE_PROJECT_KEY",
        "NUBASE_AGENT_ID": "codex"
      }
    }
  }
}
```

Remote MCP config shape, for clients that support URL-based MCP:

```json
{
  "mcpServers": {
    "nubase": {
      "url": "http://localhost:9999/mcp",
      "headers": {
        "apikey": "YOUR_NUBASE_PROJECT_KEY"
      }
    }
  }
}
```

AI Gateway model config is separate from MCP tools:

```bash
OPENAI_BASE_URL=http://localhost:9999/v1
OPENAI_API_KEY=YOUR_NUBASE_AI_GATEWAY_KEY
ANTHROPIC_BASE_URL=http://localhost:9999
ANTHROPIC_AUTH_TOKEN=YOUR_NUBASE_AI_GATEWAY_KEY
```

Some clients support both MCP tools and custom model base URLs. Some support only one. The stable Nubase contracts are endpoint plus headers for MCP, and OpenAI-compatible `/v1/*` plus Anthropic-compatible `/v1/messages` for AI Gateway.
