import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/src/components/pwa/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Netcomp RF S.A.S.",
  description: "Conecta tu mundo digital",
  applicationName: "Netcomp RF ISP",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Netcomp RF", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/portfolio/netcomp.pn", sizes: "192x192", type: "image/png" }, { url: "/icons/netcomp-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/netcomp-192.png" },
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
      <body className="min-h-full flex flex-col"><PWARegister />{children}</body>
    </html>
  );
}
