'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function CheckInForm() {
  const [borrowed, setBorrowed] = useState<any[]>([])
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBorrowed = async () => {
      const { data, error } = await supabase
        .from('borrow_records')
        .select('*, book:book_id(*), member:member_id(*)')
        .is('return_date', null)

      if (data) setBorrowed(data)
    }
    fetchBorrowed()
  }, [])

  const handleReturn = async () => {
    if (!selectedRecord) return

    setLoading(true)
    const returnDate = new Date()
    const due = dayjs(selectedRecord.due_date)
    const today = dayjs(returnDate)
    const daysLate = today.diff(due, 'day')
    const fine = daysLate > 0 ? 3 + (daysLate - 1) : 0

    const { error: updateBorrow } = await supabase
      .from('borrow_records')
      .update({ return_date: returnDate, fine })
      .eq('id', selectedRecord.id)

    const { error: updateBook } = await supabase
      .from('books')
      .update({ status: 'available' })
      .eq('id', selectedRecord.book.id)

    setLoading(false)
    if (updateBorrow || updateBook) {
      setMessage('❌ Return failed')
    } else {
      setMessage(`✅ Returned. Fine: ₹${fine}`)
      setSelectedRecord(null)
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold">📥 Check In Book</h2>

      <select
        className="w-full p-2 border rounded"
        onChange={(e) =>
          setSelectedRecord(
            borrowed.find((r) => r.id === e.target.value) || null
          )
        }
      >
        <option value="">-- Select Borrowed Book --</option>
        {borrowed.map((r) => (
          <option key={r.id} value={r.id}>
            {r.book.title} → {r.member.name}
          </option>
        ))}
      </select>

      {selectedRecord && (
        <div className="text-sm text-gray-700">
          <p><strong>Member:</strong> {selectedRecord.member.name}</p>
          <p><strong>Due Date:</strong> {dayjs(selectedRecord.due_date).format('YYYY-MM-DD')}</p>
        </div>
      )}

      <button
        onClick={handleReturn}
        disabled={!selectedRecord || loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Processing...' : 'Check In'}
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  )
}
