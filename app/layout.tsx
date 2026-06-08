import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelf Esteem — Literary Taste Analyzer",
  description: "Find out what your book choices say about you. AI-powered literary roasts and personality profiles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
