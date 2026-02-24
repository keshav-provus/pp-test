import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "next-themes";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Provus Planning Poker – Agile Sprint Estimation Tool",
  description:
    "A real-time Planning Poker web application for agile teams at Provus. Collaborate, vote story points, and sync estimates directly with Jira. Secure Google sign-in with domain restriction.",
  keywords: [
    "Planning Poker",
    "Agile estimation",
    "Sprint planning",
    "Jira integration",
    "Provus",
    "Story point voting",
    "Next.js",
    "Supabase",
    "Real-time collaboration",
  ],
  authors: [
    { name: "Provus Engineering Team" }
  ],
  applicationName: "Provus Planning Poker",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Provus Planning Poker",
    description:
      "A secure and real-time Planning Poker tool built for Provus agile teams. Vote story points, collaborate live, and push estimates to Jira.",
    url: "https://provus.ai",
    siteName: "Provus Planning Poker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Provus Planning Poker",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Provus Planning Poker",
    description:
      "Real-time agile estimation tool for Provus teams with Google SSO and Jira sync.",
    images: ["/og-image.png"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </Providers>
        
      </body>
    </html>
  );
}
