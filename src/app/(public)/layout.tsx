import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SessionHeader } from "@/features/auth/session-header";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Neutral header (no account links) while the session is read */}
     <Suspense
  fallback={
    <div
      aria-hidden="true"
      className="h-18 border-b border-transparent lg:h-22"
    />
  }
>
  <SessionHeader />
</Suspense>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
