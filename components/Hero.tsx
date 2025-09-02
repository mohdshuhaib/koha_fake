'use client'

import Link from "next/link"
import { Send } from "lucide-react"

export default function Hero() {
  const devzora = (
    <a
      href="https://devzoranet.vercel.app"
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-button-yellow hover:underline transition"
    >
      DevZora
    </a>
  )

  return (
    // ✅ FIX: Changed 'items-center' to 'md:items-center' and adjusted padding.
    // This vertically centers the card only on medium screens and up.
    // On mobile, it aligns to the top, preventing overflow.
    <div className="min-h-full w-full bg-primary-grey flex justify-center md:items-center py-24 px-4">

      <div className="max-w-4xl w-full text-center bg-green-new rounded-3xl shadow-2xl p-8 md:p-12 space-y-6">

        <h1 className="text-4xl md:text-5xl uppercase font-heading bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg leading-tight">
          Welcome to PMSA Library
        </h1>

        <p className="text-lg md:text-xl text-green-100 font-medium max-w-xl mx-auto">
          Your Digital Companion for Smarter Reading
        </p>

        <p className="text-base text-green-200 leading-relaxed max-w-2xl mx-auto">
          Explore a world of books, manage checkouts, and stay updated — all from a seamless, intuitive interface made for PMSA Wafy College.
        </p>

        <div className="flex justify-center gap-4 flex-wrap pt-4 uppercase font-heading">
          <Link
            href="/catalog"
            className="px-8 py-3 bg-button-yellow text-button-text-black rounded-full shadow-lg hover:bg-yellow-400 transition-colors duration-300"
          >
            Browse Catalog
          </Link>

          <Link
            href="/login"
            className="px-8 py-3 text-secondary-white border border-light-green rounded-full shadow-lg hover:bg-dark-green hover:text-white transition-colors duration-300"
          >
            Librarian Login
          </Link>
        </div>

        <div className="pt-6 space-y-3">
          <p className="text-sm text-gray-300">
            Are you a member of PMSA Library?{' '}
            <Link
              href="/member-login"
              className="font-semibold text-light-green hover:underline"
            >
              Login here
            </Link>
          </p>

          <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
            <Send size={14} /> Join our library{' '}
            <a
              href="https://t.me/librarypmsa"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-light-green hover:underline"
            >
              Telegram group
            </a>
          </p>
        </div>

        <div className="pt-8 text-xs text-gray-400">
          Made with ❤️ by {devzora}
        </div>
      </div>
    </div>
  )
}
