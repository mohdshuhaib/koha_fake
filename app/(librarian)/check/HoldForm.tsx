'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  User,
  Book,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
} from 'lucide-react'
import clsx from 'classnames'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'

type MemberSuggestion = {
  name: string
  barcode: string
}

type HoldPolicy = 'strict' | 'flexible'

export default function HoldForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [memberQuery, setMemberQuery] = useState('')
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const [holdPolicy, setHoldPolicy] = useState<HoldPolicy>('strict')

  const [isMemberScannerOpen, setIsMemberScannerOpen] = useState(false)
  const [isBookScannerOpen, setIsBookScannerOpen] = useState(false)

  const memberInputRef = useRef<HTMLInputElement>(null)
  const bookInputRef = useRef<HTMLInputElement>(null)

  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.matchMedia('(pointer: coarse)').matches
    )
  }, [])

  useEffect(() => {
    memberInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (memberQuery.trim().length > 1 && memberBarcode === '') {
        fetchMemberSuggestions()
      } else {
        setSuggestions([])
        setActiveSuggestionIndex(-1)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [memberQuery, memberBarcode])

  const fetchMemberSuggestions = async () => {
    const query = memberQuery.trim()

    const { data, error } = await supabase
      .from('members')
      .select('name, barcode')
      .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(5)

    if (!error && data) {
      setSuggestions(data)
      setActiveSuggestionIndex(data.length > 0 ? 0 : -1)
    } else {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
    }
  }

  const handleSelectMember = (member: MemberSuggestion) => {
    setMemberBarcode(member.barcode)
    setMemberQuery(`${member.name} (${member.barcode})`)
    setSuggestions([])
    setActiveSuggestionIndex(-1)
    setTimeout(() => bookInputRef.current?.focus(), 100)
  }

  const handleHold = async () => {
    if (!memberBarcode || !bookBarcode) return

    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name')
      .eq('barcode', memberBarcode)
      .single()

    if (memberError || !member) {
      setMessage('Member not found. Please check the barcode.')
      setIsError(true)
      resetForm()
      return
    }

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status')
      .eq('barcode', bookBarcode)
      .single()

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
      .single()

    if (existingHold) {
      setMessage(`Book "${book.title}" is already on hold for another member.`)
      setIsError(true)
      resetForm()
      return
    }

    const { error: holdError } = await supabase
      .from('hold_records')
      .insert({
        book_id: book.id,
        member_id: member.id,
        hold_policy: holdPolicy,
      })

    if (holdError) {
      setMessage('Could not place a hold on the book. Please try again.')
      setIsError(true)
      resetForm()
      return
    }

    if (book.status === 'available') {
      const { error: updateBookError } = await supabase
        .from('books')
        .update({ status: 'held' })
        .eq('id', book.id)

      if (updateBookError) {
        setMessage('Failed to update book status, but the hold was placed.')
        setIsError(true)
      } else {
        setMessage(
          holdPolicy === 'strict'
            ? `Book "${book.title}" is now on strict hold for ${member.name}.`
            : `Book "${book.title}" is now on flexible hold for ${member.name}.`
        )
        setIsError(false)
      }
    } else {
      setMessage(
        holdPolicy === 'strict'
          ? `Book "${book.title}" is currently borrowed. A strict hold has been placed for ${member.name}.`
          : `Book "${book.title}" is currently borrowed. A flexible hold has been placed for ${member.name}.`
      )
      setIsError(false)
    }

    resetForm()
  }

  const resetForm = () => {
    setBookBarcode('')
    setMemberBarcode('')
    setMemberQuery('')
    setSuggestions([])
    setActiveSuggestionIndex(-1)
    setHoldPolicy('strict')
    setLoading(false)
    setTimeout(() => memberInputRef.current?.focus(), 200)
  }

  const clearMemberAndReset = () => {
    resetForm()
  }

  const handleMemberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (suggestions.length > 0 && activeSuggestionIndex >= 0) {
        handleSelectMember(suggestions[activeSuggestionIndex])
        return
      }

      if (memberQuery.trim()) {
        setMemberBarcode(memberQuery.trim())
        setSuggestions([])
        setActiveSuggestionIndex(-1)
        setTimeout(() => bookInputRef.current?.focus(), 100)
      }
      return
    }

    if (e.key === 'Escape') {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-xl font-bold font-heading text-heading-text-black uppercase">
        Place a Book on Hold
      </h2>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-text-grey" />
        </div>

        <input
          ref={memberInputRef}
          type="text"
          placeholder="Enter member name or scan barcode"
          className="w-full p-3 pl-12 pr-20 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          value={memberQuery}
          onChange={(e) => {
            setMemberQuery(e.target.value)
            setMemberBarcode('')
          }}
          onKeyDown={handleMemberKeyDown}
          disabled={loading}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {isMobileDevice && !loading && (
            <button
              type="button"
              onClick={() => setIsMemberScannerOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-text-grey hover:text-dark-green hover:bg-secondary-white transition"
              aria-label="Scan member barcode"
            >
              <Camera size={18} />
            </button>
          )}

          {memberQuery && !loading && (
            <button
              type="button"
              onClick={clearMemberAndReset}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-text-grey hover:text-red-500 hover:bg-secondary-white transition"
              aria-label="Clear member"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-secondary-white text-text-grey border border-primary-dark-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((member, index) => (
              <li
                key={member.barcode}
                onClick={() => handleSelectMember(member)}
                className={clsx(
                  'px-4 py-3 cursor-pointer transition',
                  activeSuggestionIndex === index
                    ? 'bg-primary-dark-grey'
                    : 'hover:bg-primary-dark-grey'
                )}
              >
                <span className="block text-sm font-medium text-heading-text-black">
                  {member.name}
                </span>
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
          placeholder="Scan book barcode"
          className="w-full p-3 pl-12 pr-14 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
          value={bookBarcode}
          onChange={(e) => setBookBarcode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleHold()}
          disabled={loading}
        />

        {isMobileDevice && !loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button"
              onClick={() => setIsBookScannerOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-text-grey hover:text-dark-green hover:bg-secondary-white transition"
              aria-label="Scan book barcode"
            >
              <Camera size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg bg-primary-grey border border-primary-dark-grey p-4">
        <h3 className="text-sm font-bold text-heading-text-black uppercase">
          Hold Rule
        </h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="holdPolicy"
            className="mt-1 accent-green-700"
            value="strict"
            checked={holdPolicy === 'strict'}
            onChange={() => setHoldPolicy('strict')}
            disabled={loading}
          />
          <div>
            <span className="block text-sm font-semibold text-heading-text-black">
              Mandatory hold
            </span>
            <span className="block text-xs text-text-grey">
              Nobody else can check out this book until the hold is released.
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="holdPolicy"
            className="mt-1 accent-green-700"
            value="flexible"
            checked={holdPolicy === 'flexible'}
            onChange={() => setHoldPolicy('flexible')}
            disabled={loading}
          />
          <div>
            <span className="block text-sm font-semibold text-heading-text-black">
              Others could check out
            </span>
            <span className="block text-xs text-text-grey">
              The holder is noted, but others may borrow it for now if needed.
            </span>
          </div>
        </label>
      </div>

      <button
        onClick={handleHold}
        className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
        disabled={loading || !memberBarcode || !bookBarcode}
      >
        {loading ? 'Processing...' : 'Hold Book'}
      </button>

      {message && (
        <div
          className={clsx(
            'flex items-center gap-3 p-3 rounded-lg text-sm',
            isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          )}
        >
          {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{message}</span>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isMemberScannerOpen}
        onClose={() => setIsMemberScannerOpen(false)}
        title="Scan Member Barcode"
        onScanSuccess={(value) => {
          setMemberBarcode(value)
          setMemberQuery(value)
          setSuggestions([])
          setActiveSuggestionIndex(-1)
          setTimeout(() => bookInputRef.current?.focus(), 100)
        }}
      />

      <BarcodeScannerModal
        isOpen={isBookScannerOpen}
        onClose={() => setIsBookScannerOpen(false)}
        title="Scan Book Barcode"
        onScanSuccess={(value) => {
          setBookBarcode(value)
        }}
      />
    </div>
  )
}