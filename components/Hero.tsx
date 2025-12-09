'use client'

import Link from "next/link"
import { Send, BookOpen, ArrowRight, Library } from "lucide-react"

export default function Hero() {
  const shuhaib = (
    <a
      href="https://shuhaibcv.vercel.app"
      target="_blank"
      rel="noreferrer"
      className="font-bold text-button-yellow hover:text-yellow-300 hover:underline transition-all duration-300"
    >
      Shuhaib
    </a>
  )

  return (
    // h-screen ensures it takes exactly the screen height.
    // pt-16 accounts for the 4rem (h-16) height of the fixed Navbar so content is perfectly centered in the remaining space.
    <div className="relative h-screen w-full bg-primary-grey overflow-hidden flex flex-col items-center justify-center pt-16 px-4 font-heading">

      {/* --- Infinity Animation Background Elements --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Adjusted blob positions and opacity for a cleaner look without the card background */}
        <div className="absolute top-[10%] left-[10%] w-[30rem] h-[30rem] bg-dark-green/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-60"></div>
        <div className="absolute top-[10%] right-[10%] w-[30rem] h-[30rem] bg-button-yellow/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-60"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[30rem] h-[30rem] bg-green-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-60"></div>
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      {/* --- Main Content --- */}
      {/* Removed bg-dark-green/90. Now it's transparent/subtle glass to let the background shine through. */}
      <div className="relative z-10 max-w-5xl w-full text-center space-y-8 animate-fade-in-up">

        {/* Floating Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 backdrop-blur-sm shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
            </span>
            <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">PMSA Wafy College</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-extrabold uppercase leading-none tracking-tight">
          <span className="bg-gradient-to-b from-gray-800 to-gray-500 bg-clip-text text-transparent drop-shadow-sm">
            Welcome to
          </span>
          <br />
          <span className="bg-gradient-to-r from-dark-green to-icon-green bg-clip-text text-transparent drop-shadow-sm">
            PMSA Library
          </span>
        </h1>

        {/* Subtitle */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-xl md:text-2xl text-heading-text-black font-medium">
            Your Digital Companion for <span className="text-dark-green underline decoration-wavy decoration-yellow-400/50 underline-offset-4">Smarter Reading</span>
          </p>
          <p className="text-base md:text-lg text-text-grey leading-relaxed font-light">
            Explore a vast world of books, manage checkouts effortlessly, and stay updated with real-time notifications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/catalog"
            className="group relative px-8 py-4 bg-button-yellow text-button-text-black rounded-full font-bold uppercase tracking-wide shadow-xl hover:shadow-yellow-400/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Browse Catalog <BookOpen size={20} />
            </span>
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>

          <Link
            href="/login"
            className="group relative px-8 py-4 bg-white/50 backdrop-blur-sm border border-primary-dark-grey text-heading-text-black rounded-full font-bold uppercase tracking-wide hover:bg-white hover:border-dark-green transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              Librarian Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Footer Links (Compact for single screen view) */}
        <div className="pt-8 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-grey">
            <Link
              href="/member-login"
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/60 transition-colors duration-200"
            >
              <Library size={16} className="text-dark-green" />
              <span>Are you a member? <span className="font-bold text-dark-green underline decoration-transparent hover:decoration-current transition-all">Login here</span></span>
            </Link>

            <a
              href="https://t.me/librarypmsa"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/60 transition-colors duration-200"
            >
              <Send size={16} className="text-blue-500" />
              <span>Join our <span className="font-bold text-blue-600 underline decoration-transparent hover:decoration-current transition-all">Telegram group</span></span>
            </a>
          </div>

          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
            Made with ❤️ by {shuhaib}
          </div>
        </div>

      </div>

      {/* --- Styles --- */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}