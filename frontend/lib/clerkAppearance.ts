// Themes the Clerk widget from this app's own CSS custom properties (app/globals.css)
// instead of Clerk's default look, so sign-in/sign-up read as part of the same product
// as the landing page and dashboard, in both light and dark.
//
// IMPORTANT: every color/background override below is an `elements.<key>` STYLE
// OBJECT, never a Tailwind className string. Tailwind v4 wraps utility classes in
// `@layer utilities`; per the CSS cascade-layers spec, ANY unlayered stylesheet
// (including Clerk's own injected CSS) always beats a layered one regardless of
// specificity or source order. Confirmed via computed styles during a dark-mode
// check: a `headerTitle: "text-fg"` className and a `formFieldInput: "bg-bg ..."`
// className both silently lost to Clerk's own defaults (title rendered Clerk's
// built-in ~#212126 regardless of our --fg token; the input stayed pure white
// regardless of --bg). Inline style objects don't have this problem — Clerk applies
// them with the highest priority, so they're the only override form used here for
// anything color-bearing. className strings are fine for layout-only utilities
// (radius, shadow) that don't fight a Clerk default.
const bg = "var(--bg)";
const bgElevated = "var(--bg-elevated)";
const fg = "var(--fg)";
const fgMuted = "var(--fg-muted)";
const border = "var(--border)";
const accent = "var(--accent)";

export const clerkAppearance = {
  variables: {
    colorPrimary: accent,
    colorBackground: bgElevated,
    colorText: fg,
    colorTextSecondary: fgMuted,
    colorInputBackground: bg,
    colorInputText: fg,
    colorDanger: "var(--bad)",
    colorSuccess: "var(--good)",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: {
      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.35)",
      border: `1px solid ${border}`,
      backgroundColor: bgElevated,
    },
    headerTitle: { color: fg },
    headerSubtitle: { color: fgMuted },
    socialButtonsBlockButton: {
      border: `1px solid ${border}`,
      backgroundColor: bgElevated,
    },
    socialButtonsBlockButtonText: { color: fg },
    dividerLine: { backgroundColor: border },
    dividerText: { color: fgMuted },
    formFieldLabel: { color: fg },
    formFieldInput: {
      border: `1px solid ${border}`,
      backgroundColor: bg,
      color: fg,
    },
    formFieldHintText: { color: fgMuted },
    footerActionText: { color: fgMuted },
    footerActionLink: { color: accent },
    footer: { backgroundColor: bgElevated, color: fgMuted },
    logoBox: { color: fgMuted },
    formButtonPrimary: {
      backgroundColor: accent,
      color: "#ffffff",
      boxShadow: "none",
    },
    identityPreviewText: { color: fg },
    identityPreviewEditButton: { color: accent },
    formResendCodeLink: { color: accent },
    otpCodeFieldInput: { color: fg, borderColor: border },
    alertText: { color: fg },
    formFieldAction: { color: accent },
    modalBackdrop: { backgroundColor: "rgb(0 0 0 / 0.5)" },
    modalContent: { backgroundColor: bgElevated },
  },
};

// Clerk's default title/subtitle pull the application's display name from the Clerk
// Dashboard ("My Application" — the default every new app gets), not this product's
// brand. Overriding here means the copy is always correct regardless of what the
// Clerk app happens to be named.
export const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to Semantic Router",
      subtitle: "Welcome back — your cache is waiting.",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Start caching queries and routing smarter in under a minute.",
    },
  },
};
