// app/layout.tsx
import '@/app/globals.css'
import Navbar from '@/components/Navbar'
import { ReactNode } from 'react'

export const metadata = {
  title: 'PMSA Library',
  description: 'Library management system for PMSA Wafy College Kattilangadi',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
