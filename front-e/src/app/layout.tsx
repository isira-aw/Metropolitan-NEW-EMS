import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import { LoadingOverlayProvider } from '@/components/ui/LoadingOverlay'

export const metadata: Metadata = {
  title: 'EMS - Employee Management System',
  description: 'Generator Service Employee Management',
  icons: {
    icon: '/MetropolitanLOGO.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
