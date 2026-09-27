// E:\projects\standards-ingestion-frontend new\app\globals.css

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MANAK ASHATRA · Specification Ingestion",
  description: "Human-in-the-loop Indian Standards specification ingestion workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}