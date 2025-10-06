'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Book, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'classnames'

export default function HoldForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  // --- NEW: State for member search ---
  const [memberQuery, setMemberQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

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

  // --- NEW: Function to fetch member suggestions ---
  const fetchMemberSuggestions = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('name, barcode')
      .ilike('name', `%${memberQuery.trim()}%`)
      .limit(5)
    if (!error) setSuggestions(data)
  }

  // --- NEW: Function to handle selecting a member from dropdown ---
  const handleSelectMember = (member: any) => {
    setMemberBarcode(member.barcode)
    setMemberQuery(`${member.name} (${member.barcode})`) // Show both for clarity
    setSuggestions([])
    setTimeout(() => bookInputRef.current?.focus(), 100)
  }

  const handleHold = async () => {
    if (!memberBarcode || !bookBarcode) return
    setLoading(true)
    setMessage('')
    setIsError(false)

    // Fetch member
    const { data: member, error: memberError } = await supabase.from('members').select('id, name').eq('barcode', memberBarcode).single()
    if (memberError || !member) {
      setMessage('Member not found. Please check the barcode.')
      setIsError(true)
      resetForm()
      return
    }

    const { data: book, error: bookError } = await supabase.from('books').select('id, title, status').eq('barcode', bookBarcode).single()
    if (bookError || !book) {
      setMessage('Book not found. Please check the barcode.')
      setIsError(true)
      resetForm()
      return
    }

    const { data: existingHold } = await supabase
        .from('hold_records')
        .select('id')
        .eq('book_id', book.id)
        .eq('released', false)
        .single();

    if (existingHold) {
        setMessage(`Book "${book.title}" is already on hold for another member.`)
        setIsError(true)
        resetForm()
        return
    }

    const { error: holdError } = await supabase.from('hold_records').insert({ book_id: book.id, member_id: member.id })

    if (holdError) {
      setMessage('Could not place a hold on the book. Please try again.')
      setIsError(true)
      resetForm()
      return
    }

    if (book.status === 'available') {
        const { error: updateBookError } = await supabase.from('books').update({ status: 'held' }).eq('id', book.id)
        if (updateBookError) {
            setMessage('Failed to update book status, but the hold was placed.')
            setIsError(true)
        } else {
            setMessage(`Book "${book.title}" was available and is now held for ${member.name}.`)
            setIsError(false)
        }
    } else {
        setMessage(`Book "${book.title}" is currently borrowed. A hold has been placed for ${member.name}.`)
        setIsError(false)
    }

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setMemberQuery('') // Clear search query on reset
    setSuggestions([])
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200)
  }

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // If no suggestions, treat input as a barcode scan and move focus
      if (suggestions.length === 0) {
        setMemberBarcode(memberQuery);
        bookInputRef.current?.focus()
      }
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-xl font-bold font-heading text-heading-text-black uppercase">Place a Book on Hold</h2>

      {/* --- UPDATED: Member Input with Search Logic --- */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><User className="h-5 w-5 text-text-grey" /></div>
        <input
          ref={memberInputRef}
          type="text"
          placeholder="Enter member name or scan barcode"
          className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          value={memberQuery}
          onChange={(e) => {
            setMemberQuery(e.target.value)
            setMemberBarcode('') // Clear barcode when user types
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
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Book className="h-5 w-5 text-text-grey" /></div>
        <input ref={bookInputRef} type="text" placeholder="Scan book barcode" className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition" value={bookBarcode} onChange={(e) => setBookBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleHold()} disabled={loading} />
      </div>
      <button onClick={handleHold} className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60" disabled={loading || !memberBarcode || !bookBarcode}>
        {loading ? 'Processing...' : 'Hold Book'}
      </button>
      {message && (
        <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
          {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  )
}
