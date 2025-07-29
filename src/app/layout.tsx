import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "AI Todo",
  description: "An AI powered todo app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
