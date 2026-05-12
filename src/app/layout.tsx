import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import DevFetchLogger from '@/components/DevFetchLogger'
import './globals.css'

export const metadata: Metadata = {
  title: 'Veridian — ADAS Validation Platform',
  description: 'Automated ADAS validation for Capgemini engineers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased h-full">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <DevFetchLogger />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
