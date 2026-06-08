import Link from 'next/link';

export default function ConceptsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">The four pillars</h1>
      <p className="mt-3 text-muted-foreground">
        nubase is built around four data primitives that an AI-native app needs to ship.
        They&apos;re peers — not features bolted onto a database — and they share one
        authentication model, one tenant boundary, and one self-hostable runtime.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Why four, why these</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Traditional BaaS (Supabase, Firebase, AWS Amplify) gives you three:
        <strong> Database · Storage · Auth</strong>. That was enough when apps were CRUD-on-data.
        AI-native apps add a fourth: <strong>Memory</strong> — durable, queryable, evolving
        knowledge about each user that the LLM can consult and update. Without it, every
        conversation starts from zero and product teams end up reinventing the same vector
        + history + entity plumbing.
      </p>

      <div className="mt-8 space-y-6">
        <Pillar
          title="Memory"
          accent="text-violet-300"
          summary="The fourth primitive: durable knowledge about each user that the LLM can read and write."
          owns={[
            'mem.memories — facts with embeddings + audit hash',
            'mem.memory_history — append-only ADD/UPDATE/DELETE log',
            'mem.entities — entity store with linked memory ids for retrieval boost',
            'mem.session_messages — rolling short-term conversation window',
          ]}
          api={[
            'POST /mem/v1/memories — write (LLM extracts facts and decides ADD/UPDATE/DELETE)',
            'POST /mem/v1/search — vector + BM25 + entity-boost fusion',
            'GET /mem/v1/memories/{id}/history — audit trail',
            'GET /mem/v1/entities — manage extracted entities',
          ]}
        />

        <Pillar
          title="Database"
          accent="text-emerald-300"
          summary="A real PostgreSQL per tenant. Your app speaks SQL — directly or via the generated REST API."
          owns={[
            'public.* — your business tables',
            'auth.users / auth.sessions / auth.refresh_tokens — identity tables',
            'Per-tenant Postgres roles (service_role · authenticated · anon)',
          ]}
          api={[
            'GET /rest/v1/{table} — PostgREST-compatible: select / filter / order / limit',
            'POST /rest/v1/{table} — insert',
            'PATCH /rest/v1/{table}?id=eq.X — update',
            'POST /auth/v1/admin/sql/execute — service-role only',
          ]}
        />

        <Pillar
          title="Storage"
          accent="text-sky-300"
          summary="S3-compatible object storage with metadata in your Postgres so ACLs are RLS-aware."
          owns={[
            'storage.buckets — bucket metadata (public / private, size limits)',
            'storage.objects — file metadata + RLS policies',
            'Object bytes live in S3 / R2 / MinIO — bring your own bucket',
          ]}
          api={[
            'POST /storage/v1/bucket — create bucket',
            'POST /storage/v1/object/{bucketId}/{path} — upload',
            'GET /storage/v1/object/sign/{bucketId}/{path} — signed URL',
          ]}
        />

        <Pillar
          title="Auth"
          accent="text-amber-300"
          summary="Issues the two-layer JWT used by every other pillar. Supabase-compatible API surface."
          owns={[
            'Tenant apikey: signs with per-tenant secret, carries the ref claim',
            'User Bearer token: carries sub + role, RLS reads via auth.uid()',
            'OAuth identities (auth.identities) + email/password',
          ]}
          api={[
            'POST /auth/v1/signup — create user',
            'POST /auth/v1/token — sign in, get access + refresh',
            'POST /auth/v1/token?grant_type=refresh_token — rotate',
            'GET /auth/v1/authorize?provider=google — OAuth start',
          ]}
        />
      </div>

      <h2 className="mt-12 text-xl font-semibold">How they fit together</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        <li>
          <strong>One request, two JWTs.</strong> Every API call carries an{' '}
          <code>apikey</code> header (tenant + role) and an optional{' '}
          <code>Authorization: Bearer</code> (end user). The first picks the database; the
          second picks the user.
        </li>
        <li>
          <strong>One tenant boundary.</strong> Memory, auth, storage metadata and your
          business tables all live in the same physical Postgres for that tenant. A breach
          of one tenant&apos;s secret cannot cross.
        </li>
        <li>
          <strong>One RLS philosophy.</strong> Database tables enforce RLS at the Postgres
          level via <code>SET LOCAL ROLE</code>. Memory enforces ownership in the service
          layer via <code>MemoryAuthScope</code> (JdbcTemplate runs as the dbUser, not RLS
          roles). Both refuse cross-user reads by default.
        </li>
        <li>
          <strong>One Studio.</strong> Provision a project, manage auth users, browse
          tables, manage storage, inspect memory — same dashboard, same apikey.
        </li>
      </ol>

      <h2 className="mt-10 text-xl font-semibold">Next</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>
          <Link href="/docs/getting-started" className="underline">Quickstart</Link>
          {' '}— stand up a backend and create a project.
        </li>
        <li>
          <Link href="/docs/memory" className="underline">Memory guide</Link>
          {' '}— the new pillar, in depth.
        </li>
      </ul>
    </div>
  );
}

function Pillar({
  title,
  accent,
  summary,
  owns,
  api,
}: {
  title: string;
  accent: string;
  summary: string;
  owns: string[];
  api: string[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className={`text-lg font-semibold ${accent}`}>{title}</h3>
      <p className="mt-1 text-sm">{summary}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owns</p>
          <ul className="mt-1.5 space-y-1 text-xs">
            {owns.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="text-foreground/40">·</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key endpoints</p>
          <ul className="mt-1.5 space-y-1 font-mono text-[11px]">
            {api.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-foreground/40">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
