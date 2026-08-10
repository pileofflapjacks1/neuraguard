import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Update after first deploy (also LISTING.md + neurabeach-manifest.json).
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://neuraguard.vercel.app",
  ),
  title: "NeuraGuard — neural-state firewall for intention streams",
  description:
    "Continuous neural-state awareness and safety layer for intention streams: fatigue manager, privacy gate, adaptive policies. Simulator-first research tool. Not implant software. Not a medical device. Not affiliated with Neuralink.",
  keywords: [
    "NeuraGuard",
    "MindGuard",
    "BCI",
    "intention stream",
    "fatigue",
    "privacy",
    "Neura Suite",
    "Neurabeach",
    "simulator",
    "accessibility",
  ],
  openGraph: {
    title: "NeuraGuard — MindGuard MVP 0.1",
    description:
      "Continuous neural-state firewall, fatigue manager, and privacy gate for intention streams. Research / simulation only.",
    type: "website",
    url: "https://neuraguard.vercel.app",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "NeuraGuard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuraGuard",
    description:
      "Neural-state firewall for intention streams. Simulator-first. Not a medical device.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-guard-bg text-guard-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
