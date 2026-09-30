import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/landing/AuthShell";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
