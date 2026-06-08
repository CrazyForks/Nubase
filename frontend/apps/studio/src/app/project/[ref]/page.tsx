'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@nubase/ui';
import { Table2, Terminal, Users, HardDrive } from 'lucide-react';
import { useSession, isProjectReady } from '@/lib/session';
import { NotProvisioned } from '@/components/not-provisioned';
import { API_BASE } from '@/lib/api';
import { useProjectRef } from '@/lib/route-params';

const QUICK_LINKS = [
  { label: 'Browse tables', href: 'editor', icon: Table2 },
  { label: 'Run SQL', href: 'sql', icon: Terminal },
  { label: 'Manage users', href: 'auth', icon: Users },
  { label: 'Browse storage', href: 'storage', icon: HardDrive },
];

export default function ProjectHome({ params }: { params: { ref: string } }) {
  const project = useSession((s) => s.project);
  const projectRef = useProjectRef(params.ref);
  const ready = isProjectReady(project);
  const name = project?.name ?? projectRef;

  if (!ready) {
    return (
      <div className="space-y-6 p-8">
        <header>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        </header>
        <NotProvisioned projectRef={projectRef} initStatus={project?.initStatus} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.href} href={`/project/${projectRef}/${q.href}`}>
              <Card className="h-full transition hover:border-foreground/30">
                <CardContent className="flex flex-col gap-2 p-5">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{q.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connection</CardTitle>
            <CardDescription>Use this API URL and key in your client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div>
              <p className="text-muted-foreground">URL</p>
              <p className="rounded-md bg-muted px-3 py-2">{API_BASE}</p>
            </div>
            <div>
              <p className="text-muted-foreground">service_role key</p>
              <p className="truncate rounded-md bg-muted px-3 py-2">
                {project?.apikey ? `${project.apikey.slice(0, 16)}…${project.apikey.slice(-6)}` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Queries, edits and migrations across this project.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No activity yet.</CardContent>
        </Card>
      </section>
    </div>
  );
}
