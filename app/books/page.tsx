'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '../loading'
import UpdateBookPanel from '@/components/UpdateBookPanel'

export default function BooksHomePage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showUpdatePanel, setShowUpdatePanel] = useState(false)
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

  if (loading) return <Loading />
  if (!isLoggedIn) return null

  return (
    <div className="pt-32 min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white px-4 pb-10">
      <h1 className="text-3xl font-extrabold mb-8">📚 Book Management</h1>

      <div className="space-y-5">
        <Link
          href="books/add"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-blue-500"
        >
          ➕ Add Single Book
        </Link>

        <Link
          href="books/bulk-upload"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-green-500"
        >
          📦 Bulk Upload Books
        </Link>

        <Link
          href="books/delete"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-red-400"
        >
          🗑️ Delete Book by Barcode
        </Link>

        <Link
          href="books/delete-multiple"
          className="block w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-red-600"
        >
          🗑️ Delete Multiple Books
        </Link>

        <button
          onClick={() => setShowUpdatePanel(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-md text-white px-2 py-4 rounded-r-xl border border-white/20 shadow-lg hover:bg-white/20 transition transform hover:scale-105 origin-center rotate-180 writing-vertical"
        >
          <span className="rotate-180 tracking-wide font-semibold">Update Book</span>
        </button>
      </div>

      <UpdateBookPanel showSidebar={showUpdatePanel} setShowSidebar={setShowUpdatePanel} />
    </div>
  )
}
