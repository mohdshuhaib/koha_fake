'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '../loading'

export default function BooksHomePage() {
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
      <Loading />
    )
  }

  if (!isLoggedIn) return null
  return (
    <div
      className="pt-32 min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-4 pb-10"
    >
      <h1 className="text-3xl font-extrabold mb-8">📚 Book Management</h1>

      <div className="space-y-5">
        <Link
          href="books/add"
          className="block w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300 px-6 py-4 rounded-lg shadow text-lg font-semibold text-white"
        >
          ➕ Add Single Book
        </Link>

        <Link
          href="books/bulk-upload"
          className="block w-full bg-green-600 hover:bg-green-700 transition-colors duration-300 px-6 py-4 rounded-lg shadow text-lg font-semibold text-white"
        >
          📦 Bulk Upload Books
        </Link>

        <Link
          href="books/delete"
          className="block w-full bg-red-600 hover:bg-red-700 transition-colors duration-300 px-6 py-4 rounded-lg shadow text-lg font-semibold text-white"
        >
          🗑️ Delete Book by Barcode
        </Link>

        <Link
          href="books/delete-multiple"
          className="block w-full bg-red-500 hover:bg-red-600 transition-colors duration-300 px-6 py-4 rounded-lg shadow text-lg font-semibold text-white"
        >
          🗑️ Delete Multiple Books
        </Link>

        <Link
          href="books/delete-all"
          className="block w-full bg-red-800 hover:bg-red-900 transition-colors duration-300 px-6 py-4 rounded-lg shadow text-lg font-semibold text-white"
        >
          🔥 Delete All Books and Records
        </Link>
      </div>
    </div>
  )
}
