import type { Metadata } from "next";
import { APP_NAME } from "@/lib/app-name";
import "./globals.css";

export const metadata: Metadata = { title: APP_NAME };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
