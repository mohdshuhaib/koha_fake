'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CheckOutForm from './CheckOutForm'
import CheckInForm from './CheckInForm'
import Loading from '@/app/loading'

export default function CheckPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
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
      <Loading/>
    )
  }

  if (!isLoggedIn) return null

  return (
     <main className="pt-28 min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-4 pb-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1
          className="text-3xl font-bold text-center"
        >
          🔁 Check In / Check Out
        </h1>

        <div
        >
          <CheckOutForm />
        </div>

        <div
        >
          <CheckInForm />
        </div>
      </div>
    </main>
  )
}
