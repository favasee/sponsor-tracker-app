import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thaqaful • Donation Sponsor Tracker & WhatsApp Dispatcher",
  description: "Next.js & Supabase application for tracking donation sponsors, issuing receipts, Excel-grade directory, and localized WhatsApp reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col bg-[#08090C] text-slate-100 font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
