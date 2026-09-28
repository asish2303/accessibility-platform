import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
 * Arial / Geist have no Malayalam glyphs, so the browser would fall back
 * to whatever system font it finds. Loading Noto Sans Malayalam gives
 * consistent, readable Malayalam text on every device.
 */
const notoSansMalayalam = Noto_Sans_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACCESS+ | Find accessibility support in Malayalam and English",
  description:
    "ACCESS+ helps people discover assistive devices, government support, service providers and repair services through a simple guided experience in Malayalam and English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansMalayalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}