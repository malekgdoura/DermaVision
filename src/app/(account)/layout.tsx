import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SessionHeader } from "@/features/auth/session-header";

/** Signed-in pages. Same frame as the public site for now; it will get its own navigation with the dashboards. */
export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Empty header space while the session is read (SiteHeader uses usePathname, not allowed in the prerendered fallback) */}
      <Suspense fallback={<div aria-hidden="true" className="h-18 border-b border-transparent lg:h-22" />}>
        <SessionHeader />
      </Suspense>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
