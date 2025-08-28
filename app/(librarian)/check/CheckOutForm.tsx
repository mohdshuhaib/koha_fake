'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { User, Book, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'classnames'

export default function CheckOutForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    memberInputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Debounce to avoid excessive API calls while typing
    const delayDebounce = setTimeout(() => {
      if (memberQuery.trim().length > 1 && memberBarcode === '') {
        fetchMemberSuggestions()
      } else {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [memberQuery, memberBarcode])

  // --- LOGIC FUNCTIONS (with updated messaging) ---
  const fetchMemberSuggestions = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('name, barcode')
      .ilike('name', `%${memberQuery.trim()}%`)
      .limit(5)
    if (!error) setSuggestions(data)
  }

  const handleSelectMember = (member: any) => {
    setMemberBarcode(member.barcode)
    setMemberQuery(`${member.name} (${member.barcode})`) // Show both for clarity
    setSuggestions([])
    setTimeout(() => bookInputRef.current?.focus(), 100)
  }

  const handleCheckout = async () => {
    if (!memberBarcode || !bookBarcode) return
    setLoading(true)
    setMessage('')
    setIsError(false)

    const issueDate = new Date()
    let dueInDays = 15

    const { data: member, error: memberError } = await supabase.from('members').select('*').eq('barcode', memberBarcode).single()
    if (memberError || !member) {
      setMessage('Member not found. Please check the name or barcode.')
      setIsError(true)
      resetForm(true)
      return
    }

    const category = member.category || 'student'
    if (category === 'teacher' || category === 'class') {
      dueInDays = 30
    }
    const dueDate = dayjs(issueDate).add(dueInDays, 'day').format('YYYY-MM-DD')

    const { data: book, error: bookError } = await supabase.from('books').select('*').eq('barcode', bookBarcode).eq('status', 'available').single()
    if (bookError || !book) {
      setMessage('Book is not available or barcode is incorrect.')
      setIsError(true)
      resetForm(false) // Only reset book field
      return
    }

    const { error: borrowError } = await supabase.from('borrow_records').insert([{ book_id: book.id, member_id: member.id, borrow_date: issueDate.toISOString(), due_date: dueDate }])
    if (borrowError) {
      setMessage('Failed to create borrow record. Please try again.')
      setIsError(true)
      resetForm(true)
      return
    }

    const { error: updateBookError } = await supabase.from('books').update({ status: 'borrowed' }).eq('id', book.id)
    if (updateBookError) {
      setMessage('Failed to update book status, but record was created.')
      setIsError(true)
      resetForm(true)
      return
    }

    setMessage(`"${book.title}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`)
    setIsError(false)
    resetForm(true)
  }

  const resetForm = (resetMember: boolean) => {
    setBookBarcode('')
    if (resetMember) {
      setMemberBarcode('')
      setMemberQuery('')
    }
    setSuggestions([])
    setLoading(false)
    if (resetMember) {
      setTimeout(() => memberInputRef.current?.focus(), 100)
    } else {
      setTimeout(() => bookInputRef.current?.focus(), 100)
    }
  }

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // If suggestions are open, don't move focus. Otherwise, do.
      if (suggestions.length === 0) {
        setMemberBarcode(memberQuery); // Treat input as a barcode scan
        bookInputRef.current?.focus()
      }
    }
  }

  const handleBookKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheckout()
    }
  }

  // --- REDESIGNED JSX ---
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">Check Out a Book</h2>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-text-grey" />
        </div>
        <input
          ref={memberInputRef}
          type="text"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          placeholder="Enter member name or scan barcode"
          value={memberQuery}
          onChange={(e) => {
            setMemberQuery(e.target.value)
            setMemberBarcode('') // Clear selected barcode on manual edit
          }}
          onKeyDown={handleMemberKeyDown}
          disabled={loading}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-secondary-white text-text-grey border border-primary-dark-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((member) => (
              <li
                key={member.barcode}
                onClick={() => handleSelectMember(member)}
                className="px-4 py-3 hover:bg-primary-dark-grey cursor-pointer transition"
              >
                <span className="block text-sm font-medium text-heading-text-black">{member.name}</span>
                <span className="block text-xs text-text-grey">{member.barcode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Book className="h-5 w-5 text-text-grey" />
        </div>
        <input
          ref={bookInputRef}
          type="text"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          placeholder="Scan book barcode"
          value={bookBarcode}
          onChange={(e) => setBookBarcode(e.target.value)}
          onKeyDown={handleBookKeyDown}
          disabled={loading}
        />
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || !memberBarcode || !bookBarcode}
        className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
      >
        {loading ? 'Processing...' : 'Check Out'}
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