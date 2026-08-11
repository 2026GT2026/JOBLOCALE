import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobLocale — Local jobs, local talent",
  description:
    "The leading recruitment marketplace connecting employers with talent in their communities.",
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
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} JobLocale. All rights reserved.</p>
            <p>The leading recruitment marketplace.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
