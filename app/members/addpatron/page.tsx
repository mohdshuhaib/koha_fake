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
    <div className="max-w-md p-4 border rounded shadow mb-6">
      <h2 className="text-xl font-semibold mb-2">Add Member Manually</h2>
      <input
        type="text"
        placeholder="Name (Shuhaib)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Select category</option>
        <option value="student">student</option>
        <option value="teacher">teacher</option>
        <option value="outside">outside</option>
        <option value="foundation">foundation</option>
      </select>
      <input
        type="text"
        placeholder="Barcode (u445)"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="batch"
        placeholder="12th Batch, Patron, Teacher"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleAddMember}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Patron
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  )
}
