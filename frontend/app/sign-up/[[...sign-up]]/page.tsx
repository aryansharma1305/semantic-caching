import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/landing/AuthShell";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
