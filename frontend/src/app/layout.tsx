import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ajedrito",
  description: "Sistema de ajedrez web local — JvJ, vs Stockfish y vs IA propia",
  icons: {
    icon: "https://i.imgur.com/ZTPwQCS.jpeg",
    shortcut: "https://i.imgur.com/ZTPwQCS.jpeg",
    apple: "https://i.imgur.com/ZTPwQCS.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F6F5F0] text-[#23372D]">
        {children}
      </body>
    </html>
  );
}
