'use client'

export default function Hero() {
  const devzora = <a href="https://devzoranet.vercel.app" target="_blank" rel="noreferrer" className="text-blue-600">DevZora</a>
  return (
    <div className="min-h-[93vh] w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden px-4">
      <div className="max-w-2xl w-full text-center bg-white shadow-2xl rounded-2xl p-10 space-y-6 border border-gray-200">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700">
          📚 Welcome to PMSA Library
        </h1>

        <p className="text-gray-600 text-lg">
          Your Digital Companion for Smarter Reading
        </p>

        <p className="text-gray-500 text-sm leading-relaxed">
          Explore a world of books, manage your checkouts, and stay updated — all from a seamless and intuitive interface.
        </p>

        <div className="flex justify-center gap-4 flex-wrap pt-2">
          <a
            href="/catalog"
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            📖 Browse Catalog
          </a>
          <a
            href="/login"
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition"
          >
            🔐 Librarian Login
          </a>
        </div>

        <div className="pt-4 text-xs text-gray-400">
          Made with ❤️ by {devzora}
        </div>
      </div>
    </div>
  )
}
