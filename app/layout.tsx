// app/layout.tsx
import '@/app/globals.css'
import Navbar from '@/components/Navbar'
import { inter, playfair, anekMal } from "./fonts";
import { ReactNode } from 'react'

export const metadata = {
  title: 'PMSA Library',
  description: 'Library management system for PMSA Wafy College Kattilangadi',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${anekMal.variable}`}>
      <head><meta name="apple-mobile-web-app-title" content="pmsalibrary" /></head>
      <body>
        <Navbar />
          {children}
      </body>
    </html>
  )
}
