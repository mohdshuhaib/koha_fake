import './globals.css'
import Navbar from '../components/Navbar'
import { muller2, muller, anekMal } from "./fonts";
import { ReactNode } from 'react'

export const metadata = {
  title: 'PMSA Library',
  description: 'Library management system for PMSA Wafy College Kattilangadi',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${muller2.variable} ${muller.variable} ${anekMal.variable}`}>
      <head><meta name="apple-mobile-web-app-title" content="pmsalibrary" /></head>
      <body className='font-body'>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
