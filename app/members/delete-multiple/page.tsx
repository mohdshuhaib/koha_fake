'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteMultipleMembers() {
  const [barcodes, setBarcodes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBulkDelete = async () => {
    const barcodeList = barcodes.split(',').map((b) => b.trim()).filter(Boolean)

    if (!barcodeList.length) return setMessage('Enter valid barcodes.')

    // 1. Get all member IDs
    const { data: members } = await supabase
      .from('members')
      .select('id, barcode')
      .in('barcode', barcodeList)

    if (!members?.length) return setMessage('No matching members found.')

    const memberIds = members.map((m) => m.id)
    setLoading(true)

    // 2. Delete borrow records
    await supabase.from('borrow_records').delete().in('member_id', memberIds)
    await supabase.from('hold_records').delete().in('member_id', memberIds)
    // 3. Delete members
    await supabase.from('members').delete().in('id', memberIds)

    // 4. Delete auth users
    for (const m of members) {
      await deleteAuthUserByEmail(`${m.barcode.toLowerCase()}@member.pmsa`)
    }

    setMessage(`${members.length} members and related records deleted.`)
    setBarcodes('')
  }

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-lg mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey space-y-6">
        <h1 className="text-3xl uppercase font-bold text-center text-heading-text-black">
          Delete Multiple Members
        </h1>

        <div className="space-y-4">
          <textarea
            value={barcodes}
            onChange={(e) => setBarcodes(e.target.value)}
            placeholder="Enter barcodes separated by commas (e.g. U445,U446,U447)"
            className="w-full h-36 p-3 bg-secondary-white border border-red-600 rounded-lg text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-red-700 transition resize-none"
          />

          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Members'}
          </button>

          {message && (
            <p className="text-sm text-text-grey mt-2">{message}</p>
          )}
        </div>
      </div>
    </main>
  )
}
