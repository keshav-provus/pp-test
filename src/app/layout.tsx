// src/app/layout.tsx

export const metadata = {
    title: 'Planning Poker',
    description: 'Jira Integration App',
  }
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    )
  }