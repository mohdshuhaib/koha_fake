import './globals.css'
import Navbar from '../components/Navbar'
import { muller2, muller, anekMal } from "./fonts";
import { ReactNode } from 'react'
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: "#2C6B2F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 3. Upgraded Metadata (SEO, WhatsApp, and PWA)
export const metadata: Metadata = {
  metadataBase: new URL("https://pmsalibrary.vercel.app"), // <-- THIS FIXES WHATSAPP!
  title: "PMSA Library - Wafy College Kattilangadi",
  description: "Library management system for PMSA Wafy College Kattilangadi.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PMSA Library",
  },
  openGraph: {
    title: "PMSA Library - Wafy College Kattilangadi",
    description: "Library management system for PMSA Wafy College Kattilangadi.",
    url: "https://pmsalibrary.vercel.app",
    siteName: "PMSA Library",
    images: [
      {
        url: "/web-app-manifest-512x512.png", // Using the icon we know is in your public folder
        width: 512,
        height: 512,
        alt: "PMSA Library Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

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
