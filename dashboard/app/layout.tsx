import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mult Trainer Stats",
  description: "Progress dashboard for the multiplication sprint trainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
