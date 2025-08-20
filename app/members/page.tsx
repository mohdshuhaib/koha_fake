'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '../loading'
import UpdatePatronPanel from '@/components/UpdatePatronPanel' // Import the new component

export default function MemberPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showUpdatePanel, setShowUpdatePanel] = useState(false) // State for the panel
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
      className="pt-32 min-h-screen bg-primary-grey px-4 pb-10"
    >
      <h1 className="text-3xl font-bold mb-6 text-heading-text-black uppercase font-heading">Patron Management</h1>

      <div className="space-y-5 uppercase font-heading">
        <Link
          href="/members/patrons-status"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          View All Patron Status
        </Link>
        <Link
          href="/members/addpatron"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          Add Single Patron
        </Link>

        <Link
          href="/members/bulkpatron"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          Bulk Upload Patron
        </Link>

        <Link
          href="/members/delete"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          Delete Patron by Barcode
        </Link>

        <Link
          href="/members/delete-multiple"
          className="block w-full bg-secondary-white rounded-xl p-6 shadow-lg hover:shadow-secondary-light-black"
        >
          Delete Multiple Patrons
        </Link>

        {/* New button to trigger the update panel */}
        <button
          onClick={() => setShowUpdatePanel(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-secondary-white text-button-text-black px-2 py-4 rounded-r-xl border border-primary-dark-grey shadow-lg transition transform hover:scale-105 origin-center rotate-180 writing-vertical"
        >
          <span className="rotate-180 tracking-wide font-semibold uppercase">Update Patron</span>
        </button>
      </div>

      {/* Render the new update panel */}
      <UpdatePatronPanel showPanel={showUpdatePanel} setShowPanel={setShowUpdatePanel} />
    </div>
  )
}
