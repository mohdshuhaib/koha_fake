'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CheckOutForm() {
  const [members, setMembers] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [memberId, setMemberId] = useState('')
  const [bookId, setBookId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: membersData } = await supabase.from('members').select('*')
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'available')

      setMembers(membersData || [])
      setBooks(booksData || [])
    }
    fetchData()
  }, [])

  const handleCheckout = async () => {
    if (!memberId || !bookId || !dueDate) {
      setMessage('⚠️ Fill all fields')
      return
    }

    setLoading(true)

    const { error: borrowError } = await supabase.from('borrow_records').insert([
      {
        book_id: bookId,
        member_id: memberId,
        due_date: dueDate,
      },
    ])

    const { error: updateBookError } = await supabase
      .from('books')
      .update({ status: 'borrowed' })
      .eq('id', bookId)

    setLoading(false)

    if (borrowError || updateBookError) {
      setMessage('❌ Checkout failed')
    } else {
      setMessage('✅ Book checked out successfully')
      setBookId('')
      setMemberId('')
      setDueDate('')
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">📤 Check Out Book</h2>

      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">-- Select Member --</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.category})
          </option>
        ))}
      </select>

      <select
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">-- Select Book --</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} ({b.barcode})
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Processing...' : 'Check Out'}
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  )
}
