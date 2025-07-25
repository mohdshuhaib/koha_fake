'use client'

import Link from "next/link"

export default function Hero() {
  const devzora = (
    <a
      href="https://devzoranet.vercel.app"
      target="_blank"
      rel="noreferrer"
      className="text-icon-green hover:underline transition"
    >
      DevZora
    </a>
  )

  return (
    <div className="min-h-[100vh] pt-20 w-full bg-primary-grey flex items-center justify-center px-4 font-body">

      <div
        className="max-w-3xl w-full text-center backdrop-blur-md bg-secondary-white border border-primary-dark-grey rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 md:p-12 space-y-6"
      >
        <h1
          className="text-4xl md:text-4xl uppercase font-heading text-icon-green drop-shadow-lg leading-tight"
        >
          Welcome to PMSA Library
        </h1>

        <p
          className="text-lg md:text-xl text-white"
        >
          Your Digital Companion for Smarter Reading
        </p>

        <p
          className="text-sm md:text-base text-white leading-relaxed"
        >
          Explore a world of books, manage checkouts, and stay updated — all from a seamless, intuitive interface made for PMSA Wafy College.
        </p>

        <div
          className="flex justify-center gap-4 flex-wrap pt-4 uppercase font-heading"
        >
          <Link
            href="/catalog"
            className="px-6 py-2.5 bg-icon-green text-button-text-black rounded-full shadow-md hover:bg-primary-dark-grey transition"
          >
            Browse Catalog
          </Link>

          <Link
            href="/login"
            className="px-6 py-2.5 bg-icon-green text-button-text-black rounded-full shadow-md hover:bg-primary-dark-grey transition"
          >
            Librarian Login
          </Link>
        </div>

        <p
          className="text-sm text-white pt-4"
        >
          Are you a member of PMSA Library?{' '}
          <Link
            href="/member-login"
            className="text-icon-green hover:underline font-medium"
          >
            Login here
          </Link>
        </p>

        <div
          className="pt-4 text-xs text-white"
        >
          Made with ❤️ by {devzora}
        </div>
      </div>
    </div>
  )
}
