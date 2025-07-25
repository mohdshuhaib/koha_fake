'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HoldForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  const handleHold = async () => {
    if (!memberBarcode || !bookBarcode) return
    setLoading(true)
    setMessage('')

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
      .eq('status', 'available') // only hold available books
      .single()

    if (bookError || !book) {
      setMessage('❌ Book not available for holding')
      resetForm()
      return
    }

    // Insert hold record
    const { error: holdError } = await supabase.from('hold_records').insert([
      {
        book_id: book.id,
        member_id: member.id,
      },
    ])

    if (holdError) {
      setMessage('❌ Could not hold book')
      resetForm()
      return
    }

    // Update book status
    const { error: updateBookError } = await supabase
      .from('books')
      .update({ status: 'held' })
      .eq('id', book.id)

    if (updateBookError) {
      setMessage('❌ Failed to update book status')
    } else {
      setMessage(`✅ Book "${book.title}" held for ${member.name}`)
    }

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200)
  }

  return (
    <div className="space-y-5">
      <input
        ref={memberInputRef}
        type="text"
        placeholder="👤 Scan member barcode"
        className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-1 focus:ring-primary-dark-grey"
        value={memberBarcode}
        onChange={(e) => setMemberBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && bookInputRef.current?.focus()}
      />
      <input
        ref={bookInputRef}
        type="text"
        placeholder="📘 Scan book barcode"
        className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-1 focus:ring-primary-dark-grey"
        value={bookBarcode}
        onChange={(e) => setBookBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleHold()}
      />
      <button
        onClick={handleHold}
        className="bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-medium px-6 py-2 rounded-lg shadow-md transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '⏳ Holding...' : '📌 Hold Book'}
      </button>
      {message && <p className="text-sm text-text-grey pt-1 font-malayalam">{message}</p>}
    </div>
  )
}
