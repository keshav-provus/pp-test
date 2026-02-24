import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ThemeSettings from "@/components/ThemeSettings";
import { ColorProvider } from "@/context/ColorContext";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Provus Planning Poker",
  description: "Dynamic estimation for agile teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Providers handles next-auth and next-themes (Light/Dark logic) */}
        <Providers>
          {/* ColorProvider handles custom HSL brand color logic */}
          <ColorProvider>
            {children}
            {/* ThemeSettings is the UI controller for both theme and color */}
            <ThemeSettings />
          </ColorProvider>
        </Providers>
      </body>
    </html>
  );
}