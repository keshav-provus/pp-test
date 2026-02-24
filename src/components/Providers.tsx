"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes"; // Needs to be installed: npm install next-themes
import { ColorProvider } from "@/context/ColorContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* ThemeProvider manages Light/Dark mode. 
        attribute="class" is required for Tailwind's dark: utilities to work. 
      */}
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {/* ColorProvider manages the dynamic HSL Brand Accent variables */}
        <ColorProvider>
          {children}
        </ColorProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}