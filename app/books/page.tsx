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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📚 Book Management</h1>

      <div className="space-y-4">
        <Link
          href="books/add"
          className="block px-4 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          ➕ Add Single Book
        </Link>

        <Link
          href="books/bulk-upload"
          className="block px-4 py-3 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
        >
          📦 Bulk Upload Books
        </Link>
        <Link
          href="books/delete"
          className="block px-4 py-3 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
        >
          🗑️ Delete Book by Barcode
        </Link>

        <Link
          href="books/delete-multiple"
          className="block px-4 py-3 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
        >
          🗑️ Delete Multiple Books
        </Link>

        <Link
          href="books/delete-all"
          className="block px-4 py-3 bg-red-800 text-white rounded shadow hover:bg-red-900 transition"
        >
          🔥 Delete All Books and Records
        </Link>

      </div>
    </div>
  )
}
