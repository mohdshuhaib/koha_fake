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
    const borrowedAt = dayjs(record.created_at)
    const daysBorrowed = returnDate.diff(borrowedAt, 'day')

    let fine = 0
    const category = record.member.category || 'student'

    let allowedDays = 15
    if (category === 'teacher') {
      allowedDays = Infinity
    } else if (category === 'class') {
      allowedDays = 30
    }

    if (daysBorrowed > allowedDays) {
      fine = 3 + (daysBorrowed - allowedDays - 1)
    }

    const { error: updateBorrow } = await supabase
      .from('borrow_records')
      .update({ return_date: returnDate.toISOString(), fine })
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
    <div
      className="space-y-5 mt-10"
    >
      <h2 className="text-2xl font-bold text-heading-text-black uppercase">Check In Book</h2>

      <input
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-dark-green bg-secondary-white text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green"
        placeholder="Scan book barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
      />

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="bg-button-yellow text-button-text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition duration-300"
      >
        {loading ? 'Processing...' : 'Check In'}
      </button>

      {message && (
        <p className="text-sm font-medium text-text-grey pt-1 font-malayalam">{message}</p>
      )}
    </div>
  )
}
