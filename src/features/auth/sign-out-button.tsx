import { buttonVariants } from "@/components/ui/button";
import { authContent } from "@/content/auth";
import { cn } from "@/lib/utils";
import { seDeconnecter } from "@/server/auth/actions";

/** Reusable sign-out control: a small form that calls the seDeconnecter server action. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={seDeconnecter}>
      <button type="submit" className={cn(buttonVariants({ variant: "secondary" }), className)}>
        {authContent.dashboard.signOut}
      </button>
    </form>
  );
}
