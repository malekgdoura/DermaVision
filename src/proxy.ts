import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/server/auth/auth.config";

// Optimistic check before the page renders: signed-out visitors go straight to /login.
// Pages still verify the session (and the role) with auth() on the server; this is not the security layer.
// Built from authConfig only (JWT check), without the database or bcrypt.
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (!request.auth?.user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
});

export const config = {
  matcher: ["/analysis/:path*", "/tableau-de-bord/:path*", "/reviews/:path*", "/recommendations/:path*"],
};
