import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allostasis Admin Dashboard",
  description: "Neurobiological health monitor dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} antialiased h-full`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
