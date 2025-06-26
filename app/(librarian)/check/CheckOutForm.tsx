'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function CheckOutForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  // Auto focus member barcode on page load
  useEffect(() => {
    memberInputRef.current?.focus()
  }, [])

  const handleCheckout = async () => {
    if (!memberBarcode || !bookBarcode) return

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
      resetForm()
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
      resetForm()
      return
    }

    // Insert borrow record
    const { error: borrowError } = await supabase.from('borrow_records').insert([
      {
        book_id: book.id,
        member_id: member.id,
        borrow_date: issueDate.toISOString(),
        due_date: dueDate,
      },
    ])

    if (borrowError) {
      console.error('❌ Insert error:', borrowError)
      setMessage('❌ Failed to insert borrow record')
      resetForm()
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
      resetForm()
      return
    }

    // Success
    setMessage(
      `✅ "${book.title}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`
    )

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200) // refocus after delay
  }

  // If member scanned and Enter pressed, go to book field
  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      bookInputRef.current?.focus()
    }
  }

  // If book scanned and Enter pressed, run checkout
  const handleBookKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckout()
    }
  }

  return (
    <div
      className="space-y-5"
    >
      <h2 className="text-2xl font-bold text-white">📤 Check Out Book</h2>

      <input
        ref={memberInputRef}
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-sidekick"
        placeholder="Scan member barcode"
        value={memberBarcode}
        onChange={(e) => setMemberBarcode(e.target.value.toLowerCase())}
        onKeyDown={handleMemberKeyDown}
      />

      <input
        ref={bookInputRef}
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-sidekick"
        placeholder="Scan book barcode"
        value={bookBarcode}
        onChange={(e) => setBookBarcode(e.target.value)}
        onKeyDown={handleBookKeyDown}
      />

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-sidekick-dark text-white px-6 py-2 rounded-lg font-semibold hover:bg-sidekick-dark/80 transition duration-300"
      >
        {loading ? 'Processing...' : 'Check Out'}
      </button>

      {message && (
        <p className="text-sm font-medium text-white/80 pt-1">{message}</p>
      )}
    </div>
  )
}
