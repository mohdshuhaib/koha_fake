'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function CheckOutForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    setMessage('')

    const issueDate = new Date()
    const dueDate = dayjs(issueDate).add(15, 'day').format('YYYY-MM-DD')

    // Fetch member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('barcode', memberBarcode)
      .single()

    if (memberError || !member) {
      setMessage('❌ Member not found')
      setLoading(false)
      return
    }

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('barcode', bookBarcode)
      .eq('status', 'available')
      .single()

    if (bookError || !book) {
      setMessage('❌ Book not available')
      setLoading(false)
      return
    }

    // Insert borrow record
    const { error: borrowError } = await supabase.from('borrow_records').insert([
      {
        book_id: book.id,
        member_id: member.id,
        borrow_date: issueDate.toISOString(), // ensure proper format
        due_date: dueDate, // already formatted YYYY-MM-DD
      },
    ])

    if (borrowError) {
      console.error('❌ Insert error:', borrowError)
      setMessage('❌ Failed to insert borrow record')
      setLoading(false)
      return
    }

    // Update book status
    const { error: updateBookError } = await supabase
      .from('books')
      .update({ status: 'borrowed' })
      .eq('id', book.id)

    if (updateBookError) {
      console.error('❌ Book update error:', updateBookError)
      setMessage('❌ Failed to update book status')
      setLoading(false)
      return
    }

    // Success
    setMessage(
      `✅ "${book.title}" issued to ${member.name}. Return date: ${dayjs(dueDate).format('DD MMM YYYY')}`
    )
    setBookBarcode('')
    setMemberBarcode('')
    setLoading(false)
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">📤 Check Out Book</h2>

      <input
        type="text"
        className="w-full border p-2 rounded"
        placeholder="Scan member barcode"
        value={memberBarcode}
        onChange={(e) => setMemberBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
      />

      <input
        type="text"
        className="w-full border p-2 rounded"
        placeholder="Scan book barcode"
        value={bookBarcode}
        onChange={(e) => setBookBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
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
