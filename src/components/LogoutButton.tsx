"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return (
    <button type="button" onClick={logout} className="text-sm whitespace-nowrap underline">
      Log out
    </button>
  );
}
