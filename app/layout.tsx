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

export const metadata: Metadata = {
  metadataBase: new URL("https://pmsalibrary.vercel.app"),
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
        url: "/web-app-manifest-512x512.png",
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
      <head>
        <meta name="apple-mobile-web-app-title" content="pmsalibrary" />
      </head>
      <body className="font-body bg-primary-grey antialiased overflow-x-hidden">
        <div className="min-h-screen overflow-x-hidden">
          <Navbar />
          <main className="overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}