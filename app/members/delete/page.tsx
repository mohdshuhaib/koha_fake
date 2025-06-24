'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteMemberPage() {
  console.log('🧩 DeleteMemberPage rendered') // ✅ debug

  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')

  const handleDelete = async () => {
    try {
      if (!barcode) return setMessage('Enter a barcode.')

      const { data: member, error } = await supabase
        .from('members')
        .select('id')
        .eq('barcode', barcode)
        .single()

      if (error || !member) {
        console.error('Member not found:', error)
        return setMessage('Member not found.')
      }

      await supabase.from('borrow_records').delete().eq('member_id', member.id)
      await supabase.from('members').delete().eq('id', member.id)

      const deleted = await deleteAuthUserByEmail(`${barcode}@member.pmsa`)

      setMessage(
        deleted
          ? '✅ Member, records, and user account deleted.'
          : '⚠️ Member and records deleted, but auth user not found.'
      )
      setBarcode('')
    } catch (err: any) {
      console.error('Deletion error:', err.message)
      setMessage('❌ Error occurred. See console.')
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">🗑️ Delete Member by Barcode</h2>
      <input
        type="text"
        placeholder="Enter Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleDelete}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Delete Member
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
