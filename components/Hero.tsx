'use client'

import Link from "next/link"

export default function Hero() {
  const devzora = (
    <a
      href="https://devzoranet.vercel.app"
      target="_blank"
      rel="noreferrer"
      className="text-sidekick-dark hover:underline transition"
    >
      DevZora
    </a>
  )

  return (
    <div className="min-h-[100vh] pt-20 w-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-4">

      <div
        className="max-w-3xl w-full text-center backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 md:p-12 space-y-6"
      >
        <h1
          className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg leading-tight"
        >
          📚 Welcome to PMSA Library
        </h1>

        <p
          className="text-lg md:text-xl text-white/90 font-medium"
        >
          Your Digital Companion for Smarter Reading
        </p>

        <p
          className="text-sm md:text-base text-white/70 leading-relaxed"
        >
          Explore a world of books, manage checkouts, and stay updated — all from a seamless, intuitive interface made for PMSA Wafy College.
        </p>

        <div
          className="flex justify-center gap-4 flex-wrap pt-4"
        >
          <Link
            href="/catalog"
            className="px-6 py-2.5 bg-sidekick-dark text-black font-semibold rounded-full shadow-md hover:bg-white hover:text-[#000000] transition"
          >
            📖 Browse Catalog
          </Link>

          <Link
            href="/login"
            className="px-6 py-2.5 border border-white text-white font-medium rounded-full hover:bg-white hover:text-[#000000] transition"
          >
            🔐 Librarian Login
          </Link>
        </div>

        <p
          className="text-sm text-white/70 pt-4"
        >
          Are you a member of PMSA Library?{' '}
          <Link
            href="/member-login"
            className="text-sidekick-dark hover:underline font-medium"
          >
            Login here
          </Link>
        </p>

        <div
          className="pt-4 text-xs text-white/60"
        >
          Made with ❤️ by {devzora}
        </div>
      </div>
    </div>
  )
}
