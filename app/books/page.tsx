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
    <div className="pt-32 min-h-screen bg-primary-grey px-4 pb-10">
      <h1 className="text-3xl font-extrabold mb-8 text-heading-text-black font-heading">📚 Book Management</h1>

      <div className="space-y-5 text-heading-text-black">
        <Link
          href="books/add"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          ➕ Add Single Book
        </Link>

        <Link
          href="books/bulk-upload"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          📦 Bulk Upload Books
        </Link>

        <Link
          href="books/delete"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          🗑️ Delete Book by Barcode
        </Link>

        <Link
          href="books/delete-multiple"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          🗑️ Delete Multiple Books
        </Link>

        <button
          onClick={() => setShowUpdatePanel(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-secondary-white text-button-text-black px-2 py-4 rounded-r-xl border border-primary-dark-grey shadow-lg transition transform hover:scale-105 origin-center rotate-180 writing-vertical"
        >
          <span className="rotate-180 tracking-wide font-semibold">Update Book</span>
        </button>
      </div>

      <UpdateBookPanel showSidebar={showUpdatePanel} setShowSidebar={setShowUpdatePanel} />
    </div>
  )
}
