import { connection } from "next/server";

import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/server/auth/auth";

/**
 * Site header that knows whether someone is signed in: members get the account navigation
 * (patients: Dashboard, My analyses…; doctors: Dashboard, Review queue), guests the public one. Must be rendered inside <Suspense>.
 */
export async function SessionHeader() {
  await connection();
  const session = await auth();
  const viewer = !session?.user ? "guest" : session.user.role === "MEDECIN" ? "doctor" : "member";
  return <SiteHeader viewer={viewer} />;
}
