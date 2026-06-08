import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  Database,
  GitBranch,
  HardDrive,
  KeyRound,
  Layers3,
  MonitorCog,
  Shield,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';
import { Button } from '@nubase/ui';

const PILLARS = [
  {
    icon: Brain,
    title: 'Memory',
    body: 'Long-term user facts, entity links, audit history, embeddings, BM25 and entity-boost retrieval.',
    detail: 'Give AI apps memory that survives the chat window.',
    href: '/docs/memory',
  },
  {
    icon: Database,
    title: 'Database',
    body: 'A real PostgreSQL database per project with a PostgREST-compatible REST API and RLS.',
    detail: 'Let AI Coding tools generate tables and call stable APIs.',
    href: '/docs/database',
  },
  {
    icon: HardDrive,
    title: 'Storage',
    body: 'S3/R2-compatible object storage with bucket metadata, signed URLs and policy-aware access.',
    detail: 'Store files without leaving the project boundary.',
    href: '/docs/storage',
  },
  {
    icon: KeyRound,
    title: 'Auth',
    body: 'Supabase-style email, OAuth, JWTs, refresh rotation, service roles and per-project secrets.',
    detail: 'Use the same identity model across every primitive.',
    href: '/docs/auth',
  },
] as const;

const AI_WORKFLOW = [
  'Generate a feature with an AI coding agent.',
  'Create tables and policies through SQL or MCP tools.',
  'Call REST, Auth, Storage and Memory from the generated app.',
  'Inspect, repair and operate the project in Studio.',
] as const;

const DIFFERENTIATORS = [
  {
    icon: Bot,
    title: 'Built for AI Coding',
    text: 'Agents get a consistent backend target: schema inspection, SQL execution, REST APIs and memory APIs.',
  },
  {
    icon: Layers3,
    title: 'Many projects, one backend',
    text: 'A single self-hosted control plane can provision and route to multiple isolated project databases.',
  },
  {
    icon: Shield,
    title: 'Isolation is the default',
    text: 'Each project has its own database, credentials, JWT secret, roles and schema cache.',
  },
] as const;

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative border-b border-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(245,158,11,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_46%)]" />
        <div className="container grid min-h-[calc(100vh-3.5rem)] items-center gap-12 py-16 lg:grid-cols-[1.03fr_0.97fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Backend services born for AI
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Ship AI-coded apps with a backend that already understands agents.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              Nubase gives AI Coding tools and product teams the backend they keep rebuilding:
              <strong className="text-foreground"> Memory, Database, Storage and Auth</strong> in
              one open, self-hostable service.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/docs/getting-started">
                <Button size="lg" variant="brand">
                  Start building <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline">
                  Explore features
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <Signal label="AI-native" value="Memory built in" />
              <Signal label="Self-hosted" value="Many projects" />
              <Signal label="Compatible" value="Postgres + REST" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-border bg-card/80 p-3 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between border-b border-border px-2 pb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TerminalSquare className="h-4 w-4" />
                  AI agent workspace
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="grid gap-3 p-2">
                <PromptLine icon={Code2} title="AI Coding" body="Create CRM tables, policies and API calls." />
                <PromptLine icon={Database} title="Nubase Database" body="Provision isolated project Postgres and expose /rest/v1." />
                <PromptLine icon={Brain} title="Nubase Memory" body="Persist preferences, entities and searchable facts." />
                <PromptLine icon={MonitorCog} title="Studio Review" body="Inspect schema, users, files, memories and SQL history." />
              </div>
              <pre className="mt-2 overflow-hidden rounded-md border border-border bg-background p-4 text-xs leading-6 text-muted-foreground">
{`agent.createTable("customers")
agent.addPolicy("owner can read")
nubase.memory.add(user, messages)
nubase.rest.insert("customers", row)

# human opens Studio and sees everything`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/30 py-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase text-muted-foreground">The missing backend layer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              AI can write the app. Nubase gives it somewhere real to run.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Generated apps still need durable data, authentication, storage, long-term memory and
              project isolation. Nubase turns those into one service that humans can operate and AI
              agents can target.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {DIFFERENTIATORS.map((item) => {
              const Icon = item.icon;
              return (
                <section key={item.title} className="rounded-lg border border-border bg-background p-5">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="container">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Four primitives</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">One backend surface for AI-native products.</h2>
            </div>
            <Link href="/docs/concepts" className="inline-flex items-center gap-1 text-sm text-foreground">
              Read the architecture <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Link
                  href={pillar.href}
                  key={pillar.title}
                  className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-semibold">{pillar.title}</h3>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{pillar.body}</p>
                  <p className="mt-3 text-sm text-foreground">{pillar.detail}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/30 py-16">
        <div className="container grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">AI Coding workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              From generated feature to durable system.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Nubase gives coding agents the primitives they need and gives humans the Studio to
              audit what happened. The result is faster iteration without losing control of data.
            </p>
          </div>
          <div className="grid gap-3">
            {AI_WORKFLOW.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-lg border border-border bg-background p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-semibold text-brand-foreground">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitBranch className="h-4 w-4 text-emerald-300" />
              Self-hosted multi-project isolation
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              One Studio. Many AI projects. Separate databases.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Supabase self-hosting is single-project oriented. Nubase is designed so one
              self-hosted control plane can manage many projects, each with its own PostgreSQL
              database, JWT secret, roles and credentials.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-6">
            <div className="grid gap-3 text-sm">
              <Capability>Database-per-project isolation</Capability>
              <Capability>Per-project Auth, Storage and Memory schemas</Capability>
              <Capability>PostgREST-compatible table APIs</Capability>
              <Capability>MCP tools for database-aware agents</Capability>
              <Capability>Studio for humans to inspect and operate</Capability>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight">
            Build with AI. Keep the backend real.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Start locally, create isolated projects, call familiar APIs and give your AI app a
            memory layer from day one.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/docs/getting-started">
              <Button size="lg" variant="brand">
                Read the quickstart <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="http://localhost:3000/projects">
              <Button size="lg" variant="outline">
                Open Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/70 p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function PromptLine({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-background/80 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

function Capability({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}
