'use client'

export default function Hero() {
  const devzora = (
    <a
      href="https://devzoranet.vercel.app"
      target="_blank"
      rel="noreferrer"
      className="text-sidekick hover:underline transition"
    >
      DevZora
    </a>
  )

  return (
    <div className="min-h-[93vh] w-full flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-sidekick px-4 overflow-hidden">
      <div className="max-w-3xl w-full text-center backdrop-blur-md bg-primary/80 border border-sidekick-dark rounded-2xl shadow-2xl p-10 md:p-14 space-y-6">

        <h1 className="text-4xl md:text-5xl font-extrabold text-sidekick drop-shadow-sm">
          📚 Welcome to PMSA Library
        </h1>

        <p className="text-lg text-white font-medium">
          Your Digital Companion for Smarter Reading
        </p>

        <p className="text-sm text-white/80 leading-relaxed">
          Explore a world of books, manage your checkouts, and stay updated — all from a seamless and intuitive interface designed for PMSA Wafy College.
        </p>

        <div className="flex justify-center gap-4 flex-wrap pt-4">
          <a
            href="/catalog"
            className="px-6 py-2 md:px-8 md:py-2.5 bg-sidekick text-black font-medium rounded-full hover:bg-sidekick-dark transition shadow-sm"
          >
            📖 Browse Catalog
          </a>
          <a
            href="/login"
            className="px-6 py-2 md:px-8 md:py-2.5 border border-sidekick text-white font-medium rounded-full hover:bg-sidekick-dark hover:text-black transition shadow-sm"
          >
            🔐 Librarian Login
          </a>
        </div>
        
        <div className="pt-4 text-xs text-white/60">
          Made with ❤️ by {devzora}
        </div>
      </div>
    </div>
  )
}
