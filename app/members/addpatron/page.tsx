'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AddMemberForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')

  const handleAddMember = async () => {
    if (!name || !email || !dob || !category) {
      setMessage('⚠️ All fields are required.')
      return
    }

    const { error } = await supabase.from('members').insert([
      {
        name,
        email,
        dob, // storing the date as provided, ensure it's in a valid date format (YYYY-MM-DD)
        category,
      },
    ])

    if (error) {
      setMessage('❌ Failed to add member.')
      console.error(error)
    } else {
      setMessage('✅ Member added successfully!')
      setName('')
      setEmail('')
      setDob('')
      setCategory('')
    }
  }

  return (
    <div className="max-w-md p-4 border rounded shadow mb-6">
      <h2 className="text-xl font-semibold mb-2">Add Member Manually</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="date"
        placeholder="Date of Birth"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="text"
        placeholder="Category (e.g. Student, Staff)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleAddMember}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Member
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  )
}
