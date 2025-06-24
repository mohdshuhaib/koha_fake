'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '../loading'
import MemberTable from '@/components/MemberTable'

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">👥 Patron Management</h1>

      <div className="space-y-4">
        <Link
          href="/members/addpatron"
          className="block px-4 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          ➕ Add Single Patron
        </Link>

        <Link
          href="/members/bulkpatron"
          className="block px-4 py-3 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
        >
          📦 Bulk Upload Patron
        </Link>

        <Link
          href="/members/delete"
          className="block px-4 py-3 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
        >
          🗑️ Delete Patron by Barcode
        </Link>

        <Link
          href="/members/delete-multiple"
          className="block px-4 py-3 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
        >
          🗑️ Delete Multiple Patrons
        </Link>

        <Link
          href="/members/delete-all"
          className="block px-4 py-3 bg-red-800 text-white rounded shadow hover:bg-red-900 transition"
        >
          🔥 Delete All Patrons and Records
        </Link>
      </div>

      <div className="mt-8">
        <MemberTable />
      </div>
    </div>
  )
}
