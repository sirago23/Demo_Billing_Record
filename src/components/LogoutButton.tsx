"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Log out"
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control px-2 text-muted whitespace-nowrap hover:text-ink tab:px-3"
    >
      <LogOut aria-hidden className="size-5" />
      <span className="hidden tab:inline">Log out</span>
    </button>
  );
}
