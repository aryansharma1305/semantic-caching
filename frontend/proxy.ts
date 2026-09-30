import { clerkMiddleware } from "@clerk/nextjs/server";

// Route protection is resource-based (app/dashboard/layout.tsx calls auth.protect()
// directly), not path-matched here — middleware path matching can diverge from how
// Next.js actually routes requests. See:
// https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
