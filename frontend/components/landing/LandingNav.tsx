"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-semibold tracking-tight text-fg">
            Semantic Router
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-fg-muted sm:flex">
          <a href="#mechanism" className="transition hover:text-fg">
            How it works
          </a>
          <a href="#security" className="transition hover:text-fg">
            Security
          </a>
          <Link href="/docs" className="transition hover:text-fg">
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:text-fg"
            >
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
