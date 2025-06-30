'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '../loading'

export default function MemberPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <Loading />
  }

  if (!isLoggedIn) return null

  return (
    <div
      className="pt-32 min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-4 pb-10"
    >
      <h1 className="text-3xl font-bold mb-6">👥 Patron Management</h1>

      <div className="space-y-5">
        <Link
          href="/members/addpatron"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-blue-500"
        >
          ➕ Add Single Patron
        </Link>

        <Link
          href="/members/bulkpatron"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-green-500"
        >
          📦 Bulk Upload Patron
        </Link>

        <Link
          href="/members/delete"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-red-400"
        >
          🗑️ Delete Patron by Barcode
        </Link>

        <Link
          href="/members/delete-multiple"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-red-600"
        >
          🗑️ Delete Multiple Patrons
        </Link>

        {/* <Link
          href="/members/delete-all"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-red-800"
        >
          🔥 Delete All Patrons and Records
        </Link> */}
      </div>
    </div>
  )
}
