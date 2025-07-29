'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function RenewBookForm() {
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRenew = async () => {
    setLoading(true)
    setMessage('')

    // Fetch book by barcode
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status')
      .eq('barcode', bookBarcode)
      .single()

    if (bookError || !book) {
      setMessage('❌ Book not found.')
      resetForm()
      return
    }

    if (book.status !== 'borrowed') {
      setMessage('⚠️ Book is not currently borrowed.')
      resetForm()
      return
    }

    // Fetch current borrow record
    const { data: borrowRecord, error: recordError } = await supabase
      .from('borrow_records')
      .select('id, due_date, member_id')
      .eq('book_id', book.id)
      .is('return_date', null)
      .order('borrow_date', { ascending: false })
      .limit(1)
      .single()

    if (recordError || !borrowRecord) {
      setMessage('❌ No active borrow record found.')
      resetForm()
      return
    }

    // ✅ Check if overdue
    const today = dayjs().startOf('day')
    const dueDate = dayjs(borrowRecord.due_date)
    if (today.isAfter(dueDate)) {
      setMessage('⚠️ Book is overdue. Please check in before borrowing again.')
      resetForm()
      return
    }

    // Fetch member info to determine renewal period
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('name, category')
      .eq('id', borrowRecord.member_id)
      .single()

    if (memberError || !member) {
      setMessage('❌ Member not found.')
      resetForm()
      return
    }

    const renewalDays = member.category === 'teacher' || member.category === 'class' ? 30 : 15

    // Calculate new due date
    const newDueDate = dayjs(borrowRecord.due_date).add(renewalDays, 'day').format('YYYY-MM-DD')

    // Update borrow record with new due date
    const { error: updateError } = await supabase
      .from('borrow_records')
      .update({ due_date: newDueDate })
      .eq('id', borrowRecord.id)

    if (updateError) {
      setMessage('❌ Failed to renew book.')
    } else {
      setMessage(`✅ "${book.title}" renewed for ${member.name}. New due date: ${dayjs(newDueDate).format('DD MMM YYYY')}`)
    }

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenew()
    }
  }

  return (
    <div className="space-y-5 mt-8">
      <h2 className="text-2xl font-bold uppercase">Renew Book</h2>

      <input
        ref={inputRef}
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey bg-secondary-white text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
        placeholder="Scan book barcode"
        value={bookBarcode}
        onChange={(e) => setBookBarcode(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        onClick={handleRenew}
        disabled={loading}
        className="bg-button-yellow text-button-text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition duration-300"
      >
        {loading ? 'Renewing...' : 'Renew Book'}
      </button>

      {message && (
        <p className="text-sm font-medium text-text-grey pt-1 font-malayalam">{message}</p>
      )}
    </div>
  )
}
