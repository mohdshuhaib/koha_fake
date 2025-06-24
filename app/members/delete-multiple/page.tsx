'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteMultipleMembers() {
  const [barcodes, setBarcodes] = useState('')
  const [message, setMessage] = useState('')

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

    // 2. Delete borrow records
    await supabase.from('borrow_records').delete().in('member_id', memberIds)

    // 3. Delete members
    await supabase.from('members').delete().in('id', memberIds)

    // 4. Delete auth users
    for (const m of members) {
      await deleteAuthUserByEmail(`${m.barcode}@member.pmsa`)
    }

    setMessage(`${members.length} members and related records deleted.`)
    setBarcodes('')
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">🗑️ Delete Multiple Members</h2>
      <textarea
        value={barcodes}
        onChange={(e) => setBarcodes(e.target.value)}
        placeholder="Enter barcodes separated by commas"
        className="w-full h-32 border p-2 rounded mb-2"
      />
      <button
        onClick={handleBulkDelete}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Delete Members
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
