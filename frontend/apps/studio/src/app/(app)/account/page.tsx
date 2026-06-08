'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@nubase/ui';
import { useSession } from '@/lib/session';

export default function AccountPage() {
  const router = useRouter();
  const { user, platformKey, hasHydrated } = useSession();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!platformKey) router.replace('/login');
  }, [hasHydrated, platformKey, router]);

  if (!hasHydrated) return null;
  if (!user) return null;

  return (
    <div className="w-full max-w-2xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Your platform user profile.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Identity used when calling the platform API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Email" value={user.email} />
          <Row label="Full name" value={user.fullName || '—'} />
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-xs text-muted-foreground">Role</span>
            <div>
              {user.role === 'super_admin' ? (
                <Badge variant="success">super admin</Badge>
              ) : (
                <Badge variant="outline">user</Badge>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {user.role === 'super_admin'
                  ? 'You can see every project in this workspace.'
                  : 'You can only see projects you own or were invited to.'}
              </p>
            </div>
          </div>
          <Row label="User ID" value={user.id} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Password and session management.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Password change and MFA are not yet implemented.
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
