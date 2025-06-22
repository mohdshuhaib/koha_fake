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
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">🔁 Check In / Check Out</h1>
      <CheckOutForm />
      <CheckInForm />
    </div>
  )
}
