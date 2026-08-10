"use client";

import { DisclaimerBanner } from "./disclaimer-banner";
import { AppNav } from "./app-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <DisclaimerBanner />
      <AppNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-guard-border px-4 py-4 text-center text-xs text-guard-muted">
        NeuraGuard · NeuraBeach suite · Research / simulation only · Not a
        medical device · Not affiliated with Neuralink ·{" "}
        <a href="https://neurabeach.com" className="text-cyan-300">
          neurabeach.com
        </a>
      </footer>
    </div>
  );
}
