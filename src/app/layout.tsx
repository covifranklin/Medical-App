import type { Metadata } from "next";
import localFont from "next/font/local";
import Nav from "@/components/shared/Nav";
import Providers from "@/components/shared/Providers";
import "./globals.css";

// Use local Geist as base; Plus Jakarta Sans loads via CSS fallback on Vercel
const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-jakarta",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PhysioTracker",
  description:
    "Track your conditions, review treatment plans, and prioritise daily exercises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Plus Jakarta Sans — loads on Vercel/production */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6 md:py-8 pb-20 md:pb-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
