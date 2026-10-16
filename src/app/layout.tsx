import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { APP_NAME } from "@/lib/app-name";
import "./globals.css";

const anuphan = Anuphan({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = { title: APP_NAME };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={anuphan.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
