import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DWTB?! Studios | Private Bid Window",
  description:
    "Private bid-and-contract platform for DWTB?! Studios Q2 2026 partnership slots.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
