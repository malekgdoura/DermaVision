import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  const text = authContent.register;

  return (
    <AuthShell overline={text.overline} title={text.title} description={text.description}>
      <RegisterForm />
    </AuthShell>
  );
}
