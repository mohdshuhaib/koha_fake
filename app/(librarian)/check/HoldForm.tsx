'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Book, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'classnames'

export default function HoldForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  // --- LOGIC FUNCTIONS (with updated messaging) ---
  const handleHold = async () => {
    if (!memberBarcode || !bookBarcode) return
    setLoading(true)
    setMessage('')
    setIsError(false)

    // Fetch member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('barcode', memberBarcode)
      .single()

    if (memberError || !member) {
      setMessage('Member not found. Please check the barcode.')
      setIsError(true)
      resetForm()
      return
    }

    // Fetch book and ensure it's available
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('barcode', bookBarcode)
      .eq('status', 'available')
      .single()

    if (bookError || !book) {
      setMessage('Book is not available for holding or barcode is incorrect.')
      setIsError(true)
      resetForm()
      return
    }

    // Insert hold record
    const { error: holdError } = await supabase.from('hold_records').insert([
      { book_id: book.id, member_id: member.id },
    ])

    if (holdError) {
      setMessage('Could not place a hold on the book. Please try again.')
      setIsError(true)
      resetForm()
      return
    }

    // Update book status to 'held'
    const { error: updateBookError } = await supabase
      .from('books')
      .update({ status: 'held' })
      .eq('id', book.id)

    if (updateBookError) {
      setMessage('Failed to update book status, but the hold was placed.')
      setIsError(true)
    } else {
      setMessage(`Book "${book.title}" has been successfully held for ${member.name}.`)
      setIsError(false)
    }

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200)
  }

  // --- REDESIGNED JSX ---
  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-xl font-bold font-heading text-heading-text-black uppercase">Hold an Available Book</h2>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-text-grey" />
        </div>
        <input
          ref={memberInputRef}
          type="text"
          placeholder="Scan member barcode"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          value={memberBarcode}
          onChange={(e) => setMemberBarcode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && bookInputRef.current?.focus()}
          disabled={loading}
        />
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Book className="h-5 w-5 text-text-grey" />
        </div>
        <input
          ref={bookInputRef}
          type="text"
          placeholder="Scan book barcode"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          value={bookBarcode}
          onChange={(e) => setBookBarcode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleHold()}
          disabled={loading}
        />
      </div>

      <button
        onClick={handleHold}
        className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
        disabled={loading || !memberBarcode || !bookBarcode}
      >
        {loading ? 'Processing...' : 'Hold Book'}
      </button>

      {message && (
        <div className={clsx(
          "flex items-center gap-3 p-3 rounded-lg text-sm",
          isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        )}>
          {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  )
}