import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  const text = authContent.login;

  return (
    <AuthShell overline={text.overline} title={text.title} description={text.description}>
      <LoginForm />
    </AuthShell>
  );
}
