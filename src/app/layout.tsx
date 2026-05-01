import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEOTHERM AI Asistent",
  description: "Demo prémiového chatbota pre GEOTHERM Slovakia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
