'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteAllMembers() {
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')

  const handleDeleteAll = async () => {
    if (confirm !== 'DELETE') {
      return setMessage('Type DELETE to confirm.')
    }

    // 1. Get all members
    const { data: members } = await supabase.from('members').select('id, barcode')

    if (!members?.length) return setMessage('No members found.')

    const memberIds = members.map((m) => m.id)

    // 2. Delete borrow records
    await supabase.from('borrow_records').delete().in('member_id', memberIds)

    // 3. Delete members
    await supabase.from('members').delete().in('id', memberIds)

    // 4. Delete auth users
    for (const m of members) {
      await deleteAuthUserByEmail(`${m.barcode}@member.pmsa`)
    }

    setMessage('All members, borrow records, and user accounts deleted.')
    setConfirm('')
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4 text-red-700">🔥 Delete ALL Members & Records</h2>
      <p className="mb-2">Type <code>DELETE</code> to confirm:</p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleDeleteAll}
        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
      >
        Delete Everything
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
