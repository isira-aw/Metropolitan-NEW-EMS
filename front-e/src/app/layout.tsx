import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'EMS - Employee Management System',
  description: 'Generator Service Employee Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
