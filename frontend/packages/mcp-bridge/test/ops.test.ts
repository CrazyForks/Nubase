import test from 'node:test';
import assert from 'node:assert/strict';
import type { BridgeConfig } from '../src/config.js';
import { NubaseClient } from '../src/nubase-client.js';

interface CapturedRequest {
  url: string;
  method: string;
  body?: unknown;
}

function nth(calls: CapturedRequest[], i: number): CapturedRequest {
  const call = calls[i];
  assert.ok(call, `expected captured request #${i}`);
  return call;
}

function makeClient(overrides: Partial<BridgeConfig> = {}) {
  const config: BridgeConfig = {
    nubaseUrl: 'http://localhost:9999',
    projectKey: 'service-role-key',
    allowSqlExecute: false,
    allowDangerousSql: false,
    allowAdminWrite: false,
    ...overrides,
  };
  const calls: CapturedRequest[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method || 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  const restore = () => {
    globalThis.fetch = originalFetch;
  };
  return { client: new NubaseClient(config), calls, restore };
}

test('read ops build query strings and never require admin write', async () => {
  const { client, calls, restore } = makeClient();
  try {
    await client.storageListBuckets({ search: 'avatars', limit: 5 });
    await client.authListUsers({ page: 2, perPage: 10, keyword: 'admin' });
    await client.gatewayUsage({ startDate: '2026-06-01', endDate: '2026-06-03' });
  } finally {
    restore();
  }

  assert.equal(nth(calls, 0).url, 'http://localhost:9999/storage/v1/bucket?search=avatars&limit=5');
  assert.equal(nth(calls, 0).method, 'GET');
  assert.equal(nth(calls, 1).url, 'http://localhost:9999/auth/v1/admin/users?page=2&per_page=10&keyword=admin');
  assert.equal(nth(calls, 2).url, 'http://localhost:9999/ai-gateway/admin/v1/usage/overview?start_date=2026-06-01&end_date=2026-06-03');
});

test('write ops are blocked unless admin write is enabled', async () => {
  const { client, calls, restore } = makeClient({ allowAdminWrite: false });
  try {
    const result = (await client.storageCreateBucket({ name: 'uploads' })) as {
      success: boolean;
      code: string;
      remedy: string;
    };
    assert.equal(result.success, false);
    assert.equal(result.code, 'PERMISSION_GATE_OFF');
    assert.match(result.remedy, /NUBASE_ALLOW_ADMIN_WRITE/);
    assert.equal(calls.length, 0, 'blocked write must not hit the network');
  } finally {
    restore();
  }
});

test('write ops call the admin API when enabled', async () => {
  const { client, calls, restore } = makeClient({ allowAdminWrite: true });
  try {
    await client.storageCreateBucket({ name: 'uploads', public: true, fileSizeLimit: 1024 });
    await client.authDeleteUser({ userId: 'u-1', softDelete: true });
    await client.gatewayIssueKey({ name: 'ci' });
  } finally {
    restore();
  }

  assert.equal(nth(calls, 0).method, 'POST');
  assert.equal(nth(calls, 0).url, 'http://localhost:9999/storage/v1/bucket');
  assert.deepEqual(nth(calls, 0).body, { name: 'uploads', public: true, file_size_limit: 1024 });
  assert.equal(nth(calls, 1).method, 'DELETE');
  assert.equal(nth(calls, 1).url, 'http://localhost:9999/auth/v1/admin/users/u-1?should_soft_delete=true');
  assert.equal(nth(calls, 2).url, 'http://localhost:9999/ai-gateway/admin/v1/keys');
  assert.deepEqual(nth(calls, 2).body, { name: 'ci' });
});

test('db_export_schema defaults to the public schema', async () => {
  const { client, calls, restore } = makeClient();
  try {
    await client.dbExportSchema({});
  } finally {
    restore();
  }
  assert.equal(nth(calls, 0).url, 'http://localhost:9999/auth/v1/admin/schema/export-ddl');
  assert.deepEqual(nth(calls, 0).body, { schemaName: 'public', includeDropStatements: false });
});

test('sql_execute records a schema change to the nubase.migrations audit trail', async () => {
  const { client, calls, restore } = makeClient({ allowSqlExecute: true, agentId: 'codex', runId: 'run-7' });
  let result: Record<string, any>;
  try {
    result = (await client.sqlExecute({ sql: "create table todos(id bigint); -- it's fine" })) as Record<string, any>;
  } finally {
    restore();
  }

  assert.equal(calls.length, 2, 'one call for the DDL, one for the audit insert');
  assert.equal(nth(calls, 0).url, 'http://localhost:9999/auth/v1/admin/sql/execute');
  const audit = String((nth(calls, 1).body as { query: string }).query);
  assert.match(audit, /create table if not exists nubase\.migrations/);
  assert.match(audit, /insert into nubase\.migrations/);
  assert.match(audit, /'SCHEMA_WRITE'/);
  assert.match(audit, /'codex'/);
  assert.match(audit, /'run-7'/);
  // single quotes in the recorded SQL must be doubled, not break the literal
  assert.match(audit, /it''s fine/);
  assert.equal(result.migrationRecorded, true);
});

test('sql_execute does not record pure data writes', async () => {
  const { client, calls, restore } = makeClient({ allowSqlExecute: true });
  try {
    await client.sqlExecute({ sql: "insert into todos(title) values ('ship')" });
  } finally {
    restore();
  }
  assert.equal(calls.length, 1, 'DATA_WRITE is not a migration; no audit insert');
});

test('recordMigrations=false disables the audit trail', async () => {
  const { client, calls, restore } = makeClient({ allowSqlExecute: true, recordMigrations: false });
  try {
    await client.sqlExecute({ sql: 'create table todos(id bigint)' });
  } finally {
    restore();
  }
  assert.equal(calls.length, 1, 'recording disabled: only the DDL call');
});

test('a failing audit insert does not fail the execute', async () => {
  const config: BridgeConfig = {
    nubaseUrl: 'http://localhost:9999',
    projectKey: 'service-role-key',
    allowSqlExecute: true,
    allowDangerousSql: false,
    allowAdminWrite: false,
  };
  const originalFetch = globalThis.fetch;
  let call = 0;
  globalThis.fetch = (async () => {
    call += 1;
    if (call === 2) return new Response('audit boom', { status: 500 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  let result: Record<string, any>;
  try {
    result = (await new NubaseClient(config).sqlExecute({ sql: 'create table todos(id bigint)' })) as Record<string, any>;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(result.migrationRecorded, false);
  assert.match(result.migrationError, /audit boom/);
  assert.equal(result.ok, true, 'the DDL itself still succeeded');
});

test('list_migrations returns an empty list when the table is absent', async () => {
  const config: BridgeConfig = {
    nubaseUrl: 'http://localhost:9999',
    projectKey: 'service-role-key',
    allowSqlExecute: false,
    allowDangerousSql: false,
    allowAdminWrite: false,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('relation "nubase.migrations" does not exist', { status: 400 })) as typeof fetch;

  let result: Record<string, any>;
  try {
    result = (await new NubaseClient(config).listMigrations({})) as Record<string, any>;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.deepEqual(result.migrations, []);
  assert.match(result.note, /No migrations recorded/);
});

test('overview aggregates every read section in one call and echoes permissions', async () => {
  const { client, calls, restore } = makeClient({ allowSqlExecute: true, userJwt: 'jwt', agentId: 'codex' });
  let result: Record<string, any>;
  try {
    result = (await client.overview({})) as Record<string, any>;
  } finally {
    restore();
  }

  const urls = calls.map((c) => c.url);
  assert.ok(urls.includes('http://localhost:9999/agent/v1/capabilities'));
  assert.ok(urls.includes('http://localhost:9999/auth/v1/admin/schema/export-ddl'));
  assert.ok(urls.includes('http://localhost:9999/storage/v1/bucket?limit=100'));
  assert.ok(urls.includes('http://localhost:9999/auth/v1/admin/users?per_page=1'));
  assert.ok(urls.includes('http://localhost:9999/ai-gateway/admin/v1/keys'));

  assert.equal(result.database.schema, 'public');
  assert.equal(result.permissions.sqlExecute, true);
  assert.equal(result.project.userScoped, true);
  assert.equal(result.project.agentId, 'codex');
  assert.ok(Array.isArray(result.nextSteps) && result.nextSteps.length > 0);
});

test('overview degrades a failing section to { error } without dropping the rest', async () => {
  const config: BridgeConfig = {
    nubaseUrl: 'http://localhost:9999',
    projectKey: 'service-role-key',
    allowSqlExecute: false,
    allowDangerousSql: false,
    allowAdminWrite: false,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    if (String(input).includes('/storage/v1/bucket')) {
      return new Response('forbidden', { status: 403 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  let result: Record<string, any>;
  try {
    result = (await new NubaseClient(config).overview({})) as Record<string, any>;
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.ok('error' in result.storage, 'failing storage section should carry an error');
  assert.deepEqual(result.capabilities, { ok: true }, 'other sections still resolve');
});
