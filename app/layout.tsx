import './globals.css' // Corrected import path
import Navbar from '../components/Navbar' // Corrected import path
import { muller2, muller, anekMal } from "./fonts";
import { ReactNode } from 'react'
import FeedbackWidget from '../components/FeedbackWidget'; // Corrected import path

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
        <main className="pb-24 lg:pb-0">
          {children}
        </main>
        <FeedbackWidget />
      </body>
    </html>
  )
}
