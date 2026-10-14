import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@mml-bookmark/ui/lib/utils";
import "@mml-bookmark/ui/globals.css";

// Admin ("backend") pages are a separate root layout so the shadcn/ui theme
// does not leak into the public site. Build these pages from @mml-bookmark/ui.

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mml-bookmark admin",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html
      lang="en"
      className={cn("antialiased font-sans", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
