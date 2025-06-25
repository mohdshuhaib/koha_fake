'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteAllMembers() {
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAll = async () => {
    if (confirm !== 'DELETE') {
      return setMessage('Type DELETE to confirm.')
    }

    // 1. Get all members
    const { data: members } = await supabase.from('members').select('id, barcode')

    if (!members?.length) return setMessage('No members found.')

    const memberIds = members.map((m) => m.id)
    setLoading(true)

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
    <main className="min-h-screen pt-28 px-4 pb-10 bg-gradient-to-br from-primary via-secondary to-sidekick text-white">
      <div className="max-w-lg mx-auto bg-white/5 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20 space-y-6">
        <h1 className="text-3xl font-bold text-center text-red-400">
          🔥 Delete ALL Members & Records
        </h1>

        <p className="text-white/80">
          This action is irreversible. Type <code className="bg-white/10 px-1 py-0.5 rounded text-red-300">DELETE</code> below to confirm:
        </p>

        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE here"
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
        />

        <button
          onClick={handleDeleteAll}
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete Everything'}
        </button>

        {message && (
          <p className="text-sm text-white/80 mt-2">{message}</p>
        )}
      </div>
    </main>
  )
}
