'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HoldForm from './HoldForm'
import HeldBooksList from './HeldBooksList'
import CheckOutForm from './CheckOutForm'
import CheckInForm from './CheckInForm'
import Loading from '@/app/loading'

export default function CheckPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [tab, setTab] = useState<'hold' | 'held'>('hold')

  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login') // Redirect if not logged in
      } else {
        setIsLoggedIn(true)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <Loading />
    )
  }

  if (!isLoggedIn) return null

  return (
    <main className="relative pt-28 min-h-screen bg-gradient-to-br from-primary via-secondary to-sidekick text-white px-4 pb-10 overflow-x-hidden">
      {/* Stylish Sidebar Toggle Button (TOP RIGHT) */}
      <button
        onClick={() => setShowSidebar(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-md text-white px-2 py-4 rounded-r-xl border border-white/20 shadow-lg hover:bg-white/20 transition transform hover:scale-105 origin-center rotate-180 writing-vertical"
      >
        <span className="rotate-180 tracking-wide font-semibold">Hold Books</span>
      </button>

      {/* Right Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[22rem] max-w-full bg-[#1e1e2f]/90 backdrop-blur-lg border-l border-white/20 shadow-2xl transition-transform duration-300 z-[70] ${showSidebar ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-sidekick-dark">📌 Hold Book</h2>
          <button onClick={() => setShowSidebar(false)} className="text-white hover:text-red-400 transition text-xl">
            ✖
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setTab('hold')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === 'hold' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                } transition`}
            >
              Hold Book
            </button>
            <button
              onClick={() => setTab('held')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === 'held' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                } transition`}
            >
              Held Books
            </button>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1 custom-scroll">
            {tab === 'hold' ? <HoldForm /> : <HeldBooksList />}
          </div>
        </div>
      </div>

      {/* Main Check In / Check Out Section */}
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center">🔁 Check In / Check Out</h1>
        <CheckOutForm />
        <CheckInForm />
      </div>
    </main>
  )
}
