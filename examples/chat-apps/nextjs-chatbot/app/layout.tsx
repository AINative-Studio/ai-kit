import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Chatbot - Next.js',
  description: 'Production-ready AI chatbot with authentication and streaming',
  keywords: ['ai', 'chatbot', 'nextjs', 'streaming', 'authentication'],
  authors: [{ name: 'AINative' }],
  openGraph: {
    title: 'AI Chatbot - Next.js',
    description: 'Production-ready AI chatbot with authentication and streaming',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
