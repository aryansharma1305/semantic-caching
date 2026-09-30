export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-fg-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Semantic Router
        </div>
        <p>Semantic caching + cost-aware model routing, self-serve.</p>
      </div>
    </footer>
  );
}
