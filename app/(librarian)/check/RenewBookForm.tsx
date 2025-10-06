'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { Barcode, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'classnames'

export default function RenewBookForm() {
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRenew = async () => {
    if (!bookBarcode) return
    setLoading(true)
    setMessage('')
    setIsError(false)

    // Step 1: Fetch book by barcode
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status')
      .eq('barcode', bookBarcode)
      .single()

    if (bookError || !book) {
      setMessage('Book not found. Please check the barcode and try again.')
      setIsError(true)
      resetForm()
      return
    }

    // Step 2: Check if the book is actually borrowed
    if (book.status !== 'borrowed') {
      setMessage(`This book ("${book.title}") is not currently checked out.`)
      setIsError(true)
      resetForm()
      return
    }

    // Step 3: Fetch the active borrow record
    const { data: borrowRecord, error: recordError } = await supabase
      .from('borrow_records')
      .select('id, due_date, member_id')
      .eq('book_id', book.id)
      .is('return_date', null)
      .order('borrow_date', { ascending: false })
      .limit(1)
      .single()

    if (recordError || !borrowRecord) {
      setMessage('An active borrow record could not be found for this book.')
      setIsError(true)
      resetForm()
      return
    }

    // Step 4: Perform date checks for renewal eligibility
    const today = dayjs().startOf('day')
    const dueDate = dayjs(borrowRecord.due_date)
    const daysUntilDue = dueDate.diff(today, 'day')

    // Check if overdue
    if (today.isAfter(dueDate)) {
      setMessage('This book is overdue. It must be checked in before it can be renewed.')
      setIsError(true)
      resetForm()
      return
    }

    // ✅ NEW: Check if it's too early to renew
    if (daysUntilDue > 5) {
        const renewalStartDate = dueDate.subtract(5, 'day').format('DD MMM YYYY');
        setMessage(`It's too early to renew. This book can be renewed on or after ${renewalStartDate}.`)
        setIsError(true)
        resetForm()
        return
    }

    // Step 5: If all checks pass, proceed with renewal
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('name, category')
      .eq('id', borrowRecord.member_id)
      .single()

    if (memberError || !member) {
      setMessage('Could not find the member associated with this loan.')
      setIsError(true)
      resetForm()
      return
    }

    const renewalDays = member.category === 'teacher' || member.category === 'class' ? 30 : 15
    const newDueDate = dayjs(borrowRecord.due_date).add(renewalDays, 'day').format('YYYY-MM-DD')

    const { error: updateError } = await supabase
      .from('borrow_records')
      .update({ due_date: newDueDate })
      .eq('id', borrowRecord.id)

    if (updateError) {
      setMessage('Failed to renew the book. Please try again.')
      setIsError(true)
    } else {
      setMessage(`"${book.title}" renewed for ${member.name}. New due date: ${dayjs(newDueDate).format('DD MMM YYYY')}`)
      setIsError(false)
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">Renew a Borrowed Book</h2>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Barcode className="h-5 w-5 text-text-grey" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          placeholder="Scan book barcode to renew"
          value={bookBarcode}
          onChange={(e) => setBookBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
      </div>

      <button
        onClick={handleRenew}
        disabled={loading || !bookBarcode}
        className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
      >
        {loading ? 'Renewing...' : 'Renew Book'}
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
