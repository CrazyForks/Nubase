import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-md bg-brand" />
          nubase
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          {children}
        </div>
        <div className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} nubase. All rights reserved.
        </div>
      </div>
      <div className="hidden bg-secondary lg:flex lg:flex-col lg:justify-end lg:p-12">
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed">
            “A Postgres-first backend that stays out of the way. We ship features, not glue code.”
          </p>
          <footer className="text-sm text-muted-foreground">— a happy team using nubase</footer>
        </blockquote>
      </div>
    </div>
  );
}
