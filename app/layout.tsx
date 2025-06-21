// app/layout.tsx
'use client'
import './globals.css'
import Navbar from '@/components/Navbar'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Pages where navbar should be hidden
  const hideNavbar = ['/login', '/signup']

  return (
    <html lang="en">
      <body>
        {!hideNavbar.includes(pathname) && <Navbar />}
        {children}
      </body>
    </html>
  )
}
