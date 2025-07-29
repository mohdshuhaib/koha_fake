'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function CheckOutForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    memberInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMemberSuggestions()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [memberQuery])

  const fetchMemberSuggestions = async () => {
    if (memberQuery.trim().length === 0) {
      setSuggestions([])
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select('name, barcode')
      .ilike('name', `%${memberQuery.trim()}%`)
      .limit(5)

    if (!error) {
      setSuggestions(data)
    }
  }

  const handleSelectMember = (member: any) => {
    setMemberBarcode(member.barcode)
    setMemberQuery(member.barcode)
    setSuggestions([])
    setTimeout(() => bookInputRef.current?.focus(), 100)
  }

  const handleCheckout = async () => {
    if (!memberBarcode || !bookBarcode) return

    setLoading(true)
    setMessage('')

    const issueDate = new Date()
    let dueInDays = 15

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

    const category = member.category || 'student'
    if (category === 'teacher' || category === 'class') {
      dueInDays = 30
    }

    const dueDate = dayjs(issueDate).add(dueInDays, 'day').format('YYYY-MM-DD')

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

    const { error: borrowError } = await supabase.from('borrow_records').insert([
      {
        book_id: book.id,
        member_id: member.id,
        borrow_date: issueDate.toISOString(),
        due_date: dueDate,
      },
    ])

    if (borrowError) {
      setMessage('❌ Failed to insert borrow record')
      resetForm()
      return
    }

    const { error: updateBookError } = await supabase
      .from('books')
      .update({ status: 'borrowed' })
      .eq('id', book.id)

    if (updateBookError) {
      setMessage('❌ Failed to update book status')
      resetForm()
      return
    }

    setMessage(
      `✅ "${book.title}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`
    )

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setMemberQuery('')
    setSuggestions([])
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200)
  }

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      bookInputRef.current?.focus()
    }
  }

  const handleBookKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault() // <-- This prevents default form submission or page reload
    handleCheckout()
  }
}

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold uppercase">Check Out Book</h2>

      <div className="relative">
        <input
          ref={memberInputRef}
          type="text"
          className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey bg-secondary-white text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          placeholder="Enter member name or scan barcode"
          value={memberQuery}
          onChange={(e) => {
            setMemberQuery(e.target.value)
            setMemberBarcode('') // clear barcode if manual input changes
          }}
          onKeyDown={handleMemberKeyDown}
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-secondary-white text-text-grey border border-primary-dark-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((member) => (
              <li
                key={member.barcode}
                onClick={() => handleSelectMember(member)}
                className="px-4 py-3 hover:bg-primary-dark-grey cursor-pointer transition duration-200"
              >
                <span className="block text-sm font-medium">{member.name}</span>
                <span className="block text-xs">{member.barcode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        ref={bookInputRef}
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey bg-secondary-white text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
        placeholder="Scan book barcode"
        value={bookBarcode}
        onChange={(e) => setBookBarcode(e.target.value)}
        onKeyDown={handleBookKeyDown}
      />

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-button-yellow text-button-text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition duration-300"
      >
        {loading ? 'Processing...' : 'Check Out'}
      </button>

      {message && (
        <p className="text-sm font-medium text-text-grey pt-1 font-malayalam">{message}</p>
      )}
    </div>
  )
}
