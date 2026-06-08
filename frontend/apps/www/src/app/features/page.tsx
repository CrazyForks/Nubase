import Link from 'next/link';
import {
  Brain,
  Database,
  HardDrive,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

/**
 * Detailed feature inventory, organized as the four pillars. Each section is the
 * source-of-truth for "what does nubase actually do" — keep it specific so engineering
 * evaluators don't have to dig through commits.
 */

interface Pillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  intro: string;
  groups: Array<{
    label: string;
    items: string[];
  }>;
  docsHref: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Brain,
    title: 'Memory',
    accent: 'border-violet-500/30 bg-violet-500/5',
    docsHref: '/docs/memory',
    intro:
      'A first-class LLM memory layer — not bolted on. mem0-compatible API, multi-signal retrieval, audit history, and per-tenant isolation that rides the same auth model as the rest of nubase.',
    groups: [
      {
        label: 'Write & decide',
        items: [
          'POST /mem/v1/memories with infer=true: LLM extracts facts and emits ADD / UPDATE / DELETE / NONE per fact',
          'infer=false path stores raw messages verbatim',
          'Per-call user / agent / run scope; deduplication by content hash',
          'Per-fact entity extraction in the same LLM call (no extra round-trip)',
        ],
      },
      {
        label: 'Retrieve',
        items: [
          'Hybrid fusion: pgvector cosine top-K + BM25 (ts_rank_cd) + entity-link boost',
          'Spread-attenuated entity boost (mem0 v3 algorithm)',
          'PG text-search config configurable (simple / english / zhparser for CJK)',
          'Advanced metadata filters: eq/ne/gt/gte/lt/lte/in/nin/contains/icontains + AND/OR/NOT',
        ],
      },
      {
        label: 'Manage & audit',
        items: [
          'Full audit history (ADD/UPDATE/DELETE) per memory id',
          'Entity store with linked_memory_ids array, hard cap for hot entities',
          'Batch delete by owner, full tenant reset with double-confirm',
          'Admin Studio: list, search, edit, history, entities, settings, danger zone',
        ],
      },
      {
        label: 'Providers',
        items: [
          'Chat: OpenAI · Anthropic · any OpenAI-compatible (DashScope, DeepSeek, Moonshot, vLLM, Ollama)',
          'Embeddings: OpenAI · generic OpenAI-compatible (1536-dim default, configurable)',
          'In-process Caffeine cache for embeddings (content-addressed, safe across tenants)',
          'Pre-flight isAvailable() — no wasted HTTP when keys missing',
        ],
      },
    ],
  },
  {
    icon: Database,
    title: 'Database',
    accent: 'border-emerald-500/30 bg-emerald-500/5',
    docsHref: '/docs/database',
    intro:
      'Every project gets a dedicated PostgreSQL database — not a schema in a shared instance. Full SQL access, RLS by default, REST API generated for every table.',
    groups: [
      {
        label: 'Isolation',
        items: [
          'Database-level multi-tenancy via RoutingDataSource + HikariCP per tenant',
          'GuardianDataSource refuses any unauthenticated DB access',
          'Per-tenant encrypted credentials, JWT secrets, role mapping',
        ],
      },
      {
        label: 'REST API',
        items: [
          'PostgREST-compatible /rest/v1/* implemented in Java (no separate process)',
          'select / filter / order / limit / offset / range pagination',
          'Schema metadata cache, refreshed via PostgreSQL NOTIFY',
        ],
      },
      {
        label: 'Security',
        items: [
          'RLS executed via SET LOCAL ROLE + request.jwt.claims GUC variable',
          'service_role / authenticated / anon role separation, BYPASSRLS for admin',
          '@RequireServiceRole AOP guard for management endpoints',
        ],
      },
    ],
  },
  {
    icon: HardDrive,
    title: 'Storage',
    accent: 'border-sky-500/30 bg-sky-500/5',
    docsHref: '/docs/storage',
    intro:
      'S3-compatible object storage with metadata in Postgres. Bucket policies, signed URLs, RLS-aware ACLs — all under the same JWT model your app already uses.',
    groups: [
      {
        label: 'Buckets & objects',
        items: [
          'Create/list/update/delete buckets via /storage/v1/bucket',
          'Public vs. private buckets, per-bucket size limits + MIME allow-list',
          'File metadata stored in storage.objects with RLS policies',
        ],
      },
      {
        label: 'Backend',
        items: [
          'AWS S3 SDK — works with Cloudflare R2, MinIO, LocalStack, any S3-compatible',
          'Per-tenant key prefix layout under one global bucket',
          'Signed URLs for time-limited public access',
        ],
      },
      {
        label: 'Vector storage (optional)',
        items: [
          'Separate AWS S3 Vectors integration for large file-content vectors',
          'Independent from Memory module — used for document/asset embeddings',
        ],
      },
    ],
  },
  {
    icon: KeyRound,
    title: 'Auth',
    accent: 'border-amber-500/30 bg-amber-500/5',
    docsHref: '/docs/auth',
    intro:
      'Supabase GoTrue-compatible: email/password, OAuth, JWT issuance, refresh-token rotation. Per-tenant JWT secrets mean a breach of one tenant cannot forge tokens for another.',
    groups: [
      {
        label: 'Identity',
        items: [
          'Email + password sign-up / sign-in / recovery',
          'OAuth providers: Google, GitHub (extensible via OAuthProvider interface)',
          'Email confirmation, password recovery, session management',
        ],
      },
      {
        label: 'Tokens',
        items: [
          'JWT access token signed with per-tenant secret (no cross-tenant forgery)',
          'Refresh token rotation with parent-link tracking',
          'Two-layer apikey: tenant-level (ref claim) + user-level (Bearer)',
        ],
      },
      {
        label: 'Admin',
        items: [
          'Provision new tenant databases via POST /auth/v1/admin/init/database',
          'Service-role token generation, schema/RLS DDL export',
          'Ad-hoc SQL execution and admin user CRUD',
        ],
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="container py-20">
      <header className="max-w-3xl">
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Capabilities
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Four pillars. One backend.
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          A complete inventory of what nubase ships out of the box — grouped by the four
          primitives an AI-native app needs: <strong>Memory · Database · Storage · Auth</strong>.
          Detailed reference lives in <Link href="/docs" className="underline">the docs</Link>.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {PILLARS.map((p) => (
          <PillarSection key={p.title} {...p} />
        ))}
      </div>
    </main>
  );
}

function PillarSection({ icon: Icon, title, accent, intro, groups, docsHref }: Pillar) {
  return (
    <section className={`rounded-2xl border p-6 ${accent}`}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{intro}</p>
          </div>
        </div>
        <Link
          href={docsHref}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        >
          Docs →
        </Link>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {g.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
