import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { RoomProvider } from "@/context/RoomContext"; 
import "./globals.css";

// Assuming you import fonts correctly here, e.g.:
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Planning Poker',
  description: 'Agile Estimation Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Used the font class correctly
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <AuthProvider>
          <RoomProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}