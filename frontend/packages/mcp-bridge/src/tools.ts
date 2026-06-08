import type { BridgeConfig } from './config.js';
import { withScope } from './context.js';
import { fetchDocs } from './docs.js';
import type { NubaseClient } from './nubase-client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'fetch_docs',
    description: 'Fetch bundled Nubase agent docs. Topics: overview, quickstart, setup, memory, database, auth, storage, ai_gateway, security, or all.',
    inputSchema: objectSchema({
      topic: { type: 'string' },
    }),
  },
  {
    name: 'nubase_capabilities',
    description: 'Discover Nubase backend capabilities and stable API paths.',
    inputSchema: objectSchema({}),
  },
  {
    name: 'nubase_instructions',
    description: 'Return agent instructions for using Nubase safely.',
    inputSchema: objectSchema({}),
  },
  {
    name: 'nubase_overview',
    description: 'One-shot snapshot of the whole backend in a single call: capabilities, database schema, storage buckets, auth users, AI Gateway keys, current permissions, and suggested next steps. Call this first when starting a Nubase task. Read-only; each section degrades gracefully if unauthorized.',
    inputSchema: objectSchema({
      schema: { type: 'string' },
    }),
  },
  {
    name: 'project_keys',
    description: "Return this project's API keys for building apps: the anon/authenticated key (safe to embed in browser/client code, subject to RLS + user JWTs) and the service_role key (server-side/trusted tooling only — never ship to a browser). Read-only.",
    inputSchema: objectSchema({}),
  },
  {
    name: 'memory_context',
    description: 'Return compact relevant memory context for a task. Scope defaults can come from NUBASE_USER_ID, NUBASE_AGENT_ID, and NUBASE_RUN_ID.',
    inputSchema: objectSchema({
      task: { type: 'string' },
      topK: { type: 'number' },
      userId: { type: 'string' },
      agentId: { type: 'string' },
      runId: { type: 'string' },
    }, ['task']),
  },
  {
    name: 'memory_search',
    description: 'Search Nubase long-term memory.',
    inputSchema: objectSchema({
      query: { type: 'string' },
      topK: { type: 'number' },
      userId: { type: 'string' },
      agentId: { type: 'string' },
      runId: { type: 'string' },
    }, ['query']),
  },
  {
    name: 'memory_write',
    description: 'Write durable Nubase memory.',
    inputSchema: objectSchema({
      content: { type: 'string' },
      infer: { type: 'boolean' },
      userId: { type: 'string' },
      agentId: { type: 'string' },
      runId: { type: 'string' },
    }, ['content']),
  },
  {
    name: 'rest_select',
    description: 'Call Nubase /rest/v1 for a table using a PostgREST query string, for example select=*&limit=10.',
    inputSchema: objectSchema({
      table: { type: 'string' },
      query: { type: 'string' },
    }, ['table']),
  },
  {
    name: 'sql_dry_run',
    description: 'Classify SQL risk and statement count without executing it.',
    inputSchema: objectSchema({ sql: { type: 'string' } }, ['sql']),
  },
  {
    name: 'sql_execute',
    description: 'Execute SQL through Nubase admin API. Disabled unless NUBASE_ALLOW_SQL_EXECUTE=true.',
    inputSchema: objectSchema({ sql: { type: 'string' } }, ['sql']),
  },
  {
    name: 'db_export_schema',
    description: 'Export table DDL for a Postgres schema (default public) to inspect the database structure. Read-only.',
    inputSchema: objectSchema({
      schema: { type: 'string' },
      tables: { type: 'string' },
      includeDrop: { type: 'boolean' },
    }),
  },
  {
    name: 'db_list_migrations',
    description: 'List the audit trail of schema-changing SQL applied through sql_execute (most recent first), with timestamp, risk, and the SQL text. Read-only; returns an empty list if nothing has been recorded yet.',
    inputSchema: objectSchema({
      limit: { type: 'number' },
    }),
  },
  {
    name: 'storage_list_buckets',
    description: 'List Nubase storage buckets. Read-only.',
    inputSchema: objectSchema({
      search: { type: 'string' },
      limit: { type: 'number' },
      offset: { type: 'number' },
    }),
  },
  {
    name: 'storage_create_bucket',
    description: 'Create a storage bucket. Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({
      name: { type: 'string' },
      public: { type: 'boolean' },
      fileSizeLimit: { type: 'number' },
    }, ['name']),
  },
  {
    name: 'storage_delete_bucket',
    description: 'Delete a storage bucket. Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({ bucketId: { type: 'string' } }, ['bucketId']),
  },
  {
    name: 'auth_list_users',
    description: 'List auth users with optional keyword search. Read-only.',
    inputSchema: objectSchema({
      page: { type: 'number' },
      perPage: { type: 'number' },
      keyword: { type: 'string' },
    }),
  },
  {
    name: 'auth_create_user',
    description: 'Create an auth user. Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({
      email: { type: 'string' },
      password: { type: 'string' },
      phone: { type: 'string' },
      role: { type: 'string' },
    }, ['email']),
  },
  {
    name: 'auth_delete_user',
    description: 'Delete an auth user by id. Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({
      userId: { type: 'string' },
      softDelete: { type: 'boolean' },
    }, ['userId']),
  },
  {
    name: 'gateway_list_keys',
    description: 'List AI Gateway self-routing keys (nbk_) for this project. Read-only.',
    inputSchema: objectSchema({}),
  },
  {
    name: 'gateway_issue_key',
    description: 'Issue a new AI Gateway key (full key returned once). Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({
      name: { type: 'string' },
      description: { type: 'string' },
      expiresAt: { type: 'string' },
    }),
  },
  {
    name: 'gateway_revoke_key',
    description: 'Revoke an AI Gateway key by id. Write op; disabled unless NUBASE_ALLOW_ADMIN_WRITE=true.',
    inputSchema: objectSchema({ id: { type: 'string' } }, ['id']),
  },
  {
    name: 'gateway_usage',
    description: 'AI Gateway usage overview (tokens, requests, cost) for a date range. Read-only.',
    inputSchema: objectSchema({
      startDate: { type: 'string' },
      endDate: { type: 'string' },
    }),
  },
];

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  config: BridgeConfig,
  client: NubaseClient
) {
  switch (name) {
    case 'fetch_docs':
      return fetchDocs(typeof args.topic === 'string' ? args.topic : undefined);
    case 'nubase_capabilities':
      return client.capabilities();
    case 'nubase_instructions':
      return client.instructions();
    case 'nubase_overview':
      return client.overview(args);
    case 'project_keys':
      return client.projectKeys();
    case 'memory_context':
      return client.memoryContext(withScope(config, args));
    case 'memory_search':
      return client.memorySearch(withScope(config, args));
    case 'memory_write':
      return client.memoryWrite(withScope(config, args));
    case 'rest_select':
      return client.restSelect(args);
    case 'sql_dry_run':
      return client.sqlDryRun(args);
    case 'sql_execute':
      return client.sqlExecute(args);
    case 'db_export_schema':
      return client.dbExportSchema(args);
    case 'db_list_migrations':
      return client.listMigrations(args);
    case 'storage_list_buckets':
      return client.storageListBuckets(args);
    case 'storage_create_bucket':
      return client.storageCreateBucket(args);
    case 'storage_delete_bucket':
      return client.storageDeleteBucket(args);
    case 'auth_list_users':
      return client.authListUsers(args);
    case 'auth_create_user':
      return client.authCreateUser(args);
    case 'auth_delete_user':
      return client.authDeleteUser(args);
    case 'gateway_list_keys':
      return client.gatewayListKeys();
    case 'gateway_issue_key':
      return client.gatewayIssueKey(args);
    case 'gateway_revoke_key':
      return client.gatewayRevokeKey(args);
    case 'gateway_usage':
      return client.gatewayUsage(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function objectSchema(properties: Record<string, unknown>, required: string[] = []) {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}
