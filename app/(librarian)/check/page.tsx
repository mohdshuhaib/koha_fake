'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HoldForm from './HoldForm'
import HeldBooksList from './HeldBooksList'
import CheckOutForm from './CheckOutForm'
import CheckInForm from './CheckInForm'
import Loading from '@/app/loading'
import RenewBookForm from './RenewBookForm'

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
    <main className="relative pt-28 min-h-screen bg-primary-grey px-4 pb-10 overflow-x-hidden">
      {/* Stylish Sidebar Toggle Button (TOP RIGHT) */}
      <button
        onClick={() => setShowSidebar(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-secondary-white text-heading-text-black px-2 py-4 rounded-r-xl border border-primary-dark-grey shadow-lg hover:bg-primary-dark-grey transition transform hover:scale-105 origin-center rotate-180 writing-vertical"
      >
        <span className="rotate-180 tracking-wide uppercase font-semibold">Hold Books</span>
      </button>

      {/* Right Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[22rem] max-w-full bg-secondary-white border-l border-primary-dark-grey shadow-2xl transition-transform duration-300 z-[70] ${showSidebar ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b border-primary-dark-grey">
          <h2 className="text-xl font-bold text-heading-text-black uppercase">Hold Book</h2>
          <button onClick={() => setShowSidebar(false)} className="text-red-600 hover:text-red-700 text-xl font-extrabold">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setTab('hold')}
              className={`px-4 py-2 rounded-lg font-medium text-sm text-heading-text-black ${tab === 'hold' ? 'bg-button-yellow' : 'bg-primary-dark-grey'
                } transition`}
            >
              Hold Book
            </button>
            <button
              onClick={() => setTab('held')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === 'held' ? 'bg-button-yellow' : 'bg-primary-dark-grey'
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
        <h1 className="text-3xl font-bold text-center text-heading-text-black uppercase">Check In / Check Out</h1>
        <CheckOutForm />
        <RenewBookForm/>
        <CheckInForm />
      </div>
    </main>
  )
}
