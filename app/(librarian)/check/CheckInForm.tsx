'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function CheckInForm() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckIn = async () => {
    setLoading(true)
    setMessage('')

    // Get book by barcode
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (!book || bookError) {
      setMessage('❌ Book not found')
      setLoading(false)
      return
    }

    // Get borrow record
    const { data: record } = await supabase
      .from('borrow_records')
      .select('*, member:member_id(*)')
      .eq('book_id', book.id)
      .is('return_date', null)
      .single()

    if (!record) {
      setMessage('⚠️ Book is not currently checked out')
      setLoading(false)
      return
    }

    const returnDate = dayjs()
    const borrowedAt = dayjs(record.created_at) // created_at = borrow date
    const daysBorrowed = returnDate.diff(borrowedAt, 'day')

    let fine = 0
    if (daysBorrowed > 15) {
      fine = 3 + (daysBorrowed - 16)
    }

    const { error: updateBorrow } = await supabase
      .from('borrow_records')
      .update({ return_date: returnDate, fine })
      .eq('id', record.id)

    const { error: updateBook } = await supabase
      .from('books')
      .update({ status: 'available' })
      .eq('id', book.id)

    if (updateBorrow || updateBook) {
      setMessage('❌ Return failed')
    } else {
      setMessage(`✅ Returned "${book.title}" by ${record.member.name}. Fine: ₹${fine}`)
    }

    setBarcode('')
    setLoading(false)
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold">📥 Check In Book (Barcode)</h2>

      <input
        type="text"
        className="w-full border p-2 rounded"
        placeholder="Scan book barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
      />

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Processing...' : 'Check In'}
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  )
}
