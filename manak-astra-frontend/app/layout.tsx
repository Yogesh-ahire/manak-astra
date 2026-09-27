import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MANAK ASTRA · Standards Intelligence Workspace", // Fixed spelling from ASHATRA
  description: "Human-in-the-loop Indian Standards specification ingestion workspace.",
  icons: {
    icon: "/logo.png", // This points to the logo in your public folder to act as a favicon
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}