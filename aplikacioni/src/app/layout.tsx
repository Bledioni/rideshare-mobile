import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Pwa from "@/components/Pwa";
import { Njoftimet } from "@/components/Njoftimet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RideShare AAB",
  description: "Udhëtime të përbashkëta për studentët e AAB.",
};

export const viewport: Viewport = {
  themeColor: "#0a0f1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sq" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              <span className="brand__logo" aria-hidden>🚗</span>
              <span>RideShare <span className="brand__accent">AAB</span></span>
            </Link>
            <nav className="site-nav" aria-label="Navigimi kryesor">
              <Link href="/">Udhëtimet</Link>
              <Link href="/panel" className="site-nav__cta">Paneli im</Link>
            </nav>
          </div>
        </header>
        {children}
        <Njoftimet />
        <Pwa />
      </body>
    </html>
  );
}
