'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteAuthUserByEmail } from '@/app/actions/deleteMember'

export default function DeleteMemberPage() {

  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
      setLoading(true)

      await supabase.from('borrow_records').delete().eq('member_id', member.id)
      await supabase.from('hold_records').delete().eq('member_id', member.id)
      await supabase.from('members').delete().eq('id', member.id)

      const deleted = await deleteAuthUserByEmail(`${barcode.toLowerCase()}@member.pmsa`)

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
     <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-lg mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey space-y-6">
        <h1 className="text-3xl font-bold text-center text-heading-text-black">
          🗑️ Delete Member by Barcode
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full p-3 bg-secondary-white border border-red-600 rounded-lg text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-red-700 transition"
          />

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Member'}
          </button>

          {message && (
            <p className="text-sm text-text-grey mt-2">{message}</p>
          )}
        </div>
      </div>
    </main>
  )
}
