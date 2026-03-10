import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/layout/Navigation'
import { Ticker } from '@/components/layout/Ticker'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FinSignal — Financial Intelligence Terminal',
  description: 'AI-powered earnings analysis, financial dashboards, and market intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary font-sans antialiased min-h-screen">
        {/* Subtle grid background */}
        <div className="fixed inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-40 z-0" />
        
        {/* Top glow */}
        <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/40 to-transparent z-10" />

        <Navigation />
        <Ticker />
        
        <main className="relative z-10 pt-[104px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
