'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

export default function AddMemberForm() {
  const [name, setName] = useState('')
  const [batch, setBatch] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [userload, setuserload] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)
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

      setCheckingSession(false)
      setuserload(false)
    }

    checkAuth()
  }, [router])

  if (userload) {
    return (
      <Loading />
    )
  }

  const handleAddMember = async () => {
    if (!name || !category || !barcode || !batch) {
      setMessage('⚠️ All fields are required.')
      return
    }

    const res = await fetch('/api/create-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, barcode, category, batch }),
    })

    const result = await res.json()

    if (!res.ok) {
      setMessage(`❌ ${result.error}`)
      return
    }

    setMessage('✅ Member created successfully!')
    setName('')
    setBarcode('')
    setCategory('')
    setBatch('')
  }

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-lg mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey space-y-6">
        <h1 className="text-3xl uppercase font-heading font-bold text-center text-heading-text-black">
          Add New Patron
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name (e.g. Shuhaib)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          >
            <option value="">Select Category</option>
            <option value="student" className='text-text-grey'>student</option>
            <option value="teacher" className='text-text-grey'>teacher</option>
            <option value="outside" className='text-text-grey'>outside</option>
            <option value="foundation" className='text-text-grey'>foundation</option>
          </select>

          <input
            type="text"
            placeholder="Barcode (e.g. U445)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          />

          <input
            type="text"
            placeholder="Batch (e.g. 12th Batch, Patron)"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          />
        </div>

        <button
          onClick={handleAddMember}
          disabled={!name || !category || !barcode}
          className="w-full uppercase bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-semibold px-4 py-3 rounded-lg transition disabled:opacity-50"
        >
          Add Patron
        </button>

        {message && (
          <p className="text-center text-sm text-text-grey border-t border-white/10 pt-4">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
