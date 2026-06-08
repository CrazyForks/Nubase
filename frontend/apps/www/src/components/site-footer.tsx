import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="container grid gap-8 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <svg viewBox="0 0 320 320" className="h-5 w-5" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="nbLogoFooter" x1="96" y1="80" x2="224" y2="240" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#3DE3AF" />
                  <stop offset="1" stopColor="#10A074" />
                </linearGradient>
              </defs>
              <path
                d="M104 240 V80 L216 240 V80"
                fill="none"
                stroke="url(#nbLogoFooter)"
                strokeWidth="40"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="216" cy="80" r="21" fill="none" stroke="#3DE3AF" strokeWidth="11" />
              <circle cx="104" cy="240" r="12" fill="#10A074" />
            </svg>
            <span className="font-semibold">nubase</span>
          </div>
          <p className="text-xs">Backend services born for AI-native apps and AI Coding.</p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Product</p>
          <ul className="space-y-1">
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/docs">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Developers</p>
          <ul className="space-y-1">
            <li><Link href="/docs/getting-started">Quickstart</Link></li>
            <li><Link href="/docs/concepts">Architecture</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Legal</p>
          <ul className="space-y-1">
            <li><Link href="/legal/privacy">Privacy</Link></li>
            <li><Link href="/legal/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} nubase. All rights reserved.
      </div>
    </footer>
  );
}
