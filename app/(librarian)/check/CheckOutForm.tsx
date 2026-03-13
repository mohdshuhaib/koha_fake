'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import {
  User,
  Book,
  CheckCircle2,
  AlertCircle,
  X,
  AlertTriangle,
  Camera,
} from 'lucide-react'
import clsx from 'classnames'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'

type HeldInfo = {
  bookId: string
  bookTitle: string
  holdId: string
  heldForMemberName: string
  holdPolicy: 'strict' | 'flexible'
}

type MemberSuggestion = {
  name: string
  barcode: string
}

export default function CheckOutForm() {
  const [memberBarcode, setMemberBarcode] = useState('')
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false)
  const [heldInfo, setHeldInfo] = useState<HeldInfo | null>(null)

  const [isFineModalOpen, setIsFineModalOpen] = useState(false)
  const [fineWarningMember, setFineWarningMember] = useState<any>(null)

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

    const { data } = await supabase
      .from('members')
      .select('name, barcode')
      .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(5)

    if (data) {
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

  const getDueDate = (category: string | null | undefined) => {
    const dueInDays =
      category === 'student'
        ? 15
        : category === 'teacher' || category === 'outside' || category === 'class'
          ? 30
          : 15

    return dayjs().startOf('day').add(dueInDays, 'day').format('YYYY-MM-DD')
  }

  const handleCheckout = async () => {
    if (!memberBarcode || !bookBarcode) return

    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, category')
      .eq('barcode', memberBarcode)
      .single()

    if (memberError || !member) {
      setMessage('Member not found. Please check the name or barcode.')
      setIsError(true)
      resetForm(true)
      return
    }

    const { count: unpaidFines, error: fineError } = await supabase
      .from('borrow_records')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('fine_paid', false)
      .gt('fine', 0)

    if (fineError) {
      setMessage("Could not verify member's fine status.")
      setIsError(true)
      resetForm(true)
      return
    }

    if (unpaidFines && unpaidFines > 0) {
      setFineWarningMember(member)
      setIsFineModalOpen(true)
      setLoading(false)
      return
    }

    await proceedWithBookChecks(member)
  }

  const proceedWithBookChecks = async (member: any) => {
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status')
      .eq('barcode', bookBarcode)
      .or('status.eq.available,status.eq.held')
      .single()

    if (bookError || !book) {
      setMessage('Book is not available for checkout or barcode is incorrect.')
      setIsError(true)
      resetForm(false)
      return
    }

    if (book.status === 'held') {
      const { data: holdRecord } = await supabase
        .from('hold_records')
        .select('id, hold_policy, member:members!inner(name)')
        .eq('book_id', book.id)
        .eq('released', false)
        .single()

      if (holdRecord) {
        const memberName = Array.isArray(holdRecord.member)
          ? holdRecord.member[0]?.name
          : (holdRecord.member as any)?.name

        if (memberName) {
          setHeldInfo({
            bookId: book.id,
            bookTitle: book.title,
            holdId: holdRecord.id,
            heldForMemberName: memberName,
            holdPolicy: holdRecord.hold_policy ?? 'strict',
          })
          setIsHoldModalOpen(true)
          setLoading(false)
          return
        }
      }
    }

    await finalizeCheckout(book.id, book.title, member)
  }

  const handleSkipFine = () => {
    if (fineWarningMember) {
      setIsFineModalOpen(false)
      setLoading(true)
      void proceedWithBookChecks(fineWarningMember)
    }
  }

  const finalizeCheckout = async (bookId: string, bookTitle: string, member: any) => {
    const dueDate = getDueDate(member.category)

    const { error: rpcError } = await supabase.rpc('checkout_book', {
      p_book_id: bookId,
      p_member_id: member.id,
      p_due_date: dueDate,
    })

    if (rpcError) {
      setMessage(rpcError.message || 'Failed to complete checkout.')
      setIsError(true)
      resetForm(false)
      return
    }

    setMessage(
      `"${bookTitle}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`
    )
    setIsError(false)
    resetForm(false)
  }

  const handleConfirmHeldCheckout = async () => {
    if (!heldInfo) return

    setLoading(true)
    setIsHoldModalOpen(false)

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, category')
      .eq('barcode', memberBarcode)
      .single()

    if (memberError || !member) {
      setMessage('Member not found.')
      setIsError(true)
      resetForm(true)
      return
    }

    const dueDate = getDueDate(member.category)

    const { error: rpcError } = await supabase.rpc('checkout_held_book', {
      p_hold_id: heldInfo.holdId,
      p_book_id: heldInfo.bookId,
      p_member_id: member.id,
      p_due_date: dueDate,
    })

    if (rpcError) {
      setMessage(rpcError.message || 'Failed to process checkout for held book.')
      setIsError(true)
      console.error(rpcError)
    } else {
      setMessage(
        `Held book "${heldInfo.bookTitle}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`
      )
      setIsError(false)
    }

    resetForm(false)
  }

  const resetForm = (resetMember: boolean) => {
    setBookBarcode('')
    if (resetMember) {
      setMemberBarcode('')
      setMemberQuery('')
    }
    setSuggestions([])
    setActiveSuggestionIndex(-1)
    setLoading(false)
    setHeldInfo(null)
    setIsHoldModalOpen(false)
    setIsFineModalOpen(false)
    setFineWarningMember(null)

    if (resetMember) {
      setTimeout(() => memberInputRef.current?.focus(), 100)
    } else {
      setTimeout(() => bookInputRef.current?.focus(), 100)
    }
  }

  const clearMemberAndReset = () => {
    resetForm(true)
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
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">
          Check Out a Book
        </h2>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <User className="h-5 w-5 text-text-grey" />
          </div>

          <input
            ref={memberInputRef}
            type="text"
            className="w-full p-3 pl-12 pr-20 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
            placeholder="Enter member name or scan barcode"
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
            className="w-full p-3 pl-12 pr-14 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
            placeholder="Scan book barcode"
            value={bookBarcode}
            onChange={(e) => setBookBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
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

        <button
          onClick={handleCheckout}
          disabled={loading || !memberBarcode || !bookBarcode}
          className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
        >
          {loading ? 'Processing...' : 'Check Out'}
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
      </div>

      {isFineModalOpen && fineWarningMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl max-w-md w-full border border-primary-dark-grey">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-xl font-bold font-heading text-heading-text-black">
                Outstanding Fine
              </h3>
              <p className="mt-2 text-sm text-text-grey">
                <strong>{fineWarningMember.name}</strong> has outstanding fines. Normally,
                borrowing is restricted until fines are paid.
              </p>
              <p className="mt-3 text-sm text-text-grey">
                To view the fines, go to the{' '}
                <Link
                  href="/fines"
                  className="font-semibold text-dark-green hover:underline"
                >
                  Fine Page
                </Link>
                .
              </p>
            </div>
            <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
              <button
                onClick={() => resetForm(false)}
                className="px-5 py-2 text-sm font-semibold text-text-grey bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipFine}
                className="px-5 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {isHoldModalOpen && heldInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl max-w-md w-full border border-primary-dark-grey">
            <div className="p-6 text-center">
              <AlertCircle
                className={clsx(
                  'mx-auto h-12 w-12',
                  heldInfo.holdPolicy === 'strict' ? 'text-red-500' : 'text-yellow-500'
                )}
              />

              <h3 className="mt-4 text-xl font-bold font-heading text-heading-text-black">
                Book on Hold
              </h3>

              {heldInfo.holdPolicy === 'strict' ? (
                <p className="mt-2 text-sm text-text-grey">
                  This book, <strong className="text-heading-text-black">"{heldInfo.bookTitle}"</strong>,
                  is on a <strong className="text-heading-text-black">strict hold</strong> for{' '}
                  <strong className="text-heading-text-black">
                    {heldInfo.heldForMemberName}
                  </strong>
                  . This means the holder may need this book at any time, so it should not be
                  issued to anybody else until the hold is released.
                </p>
              ) : (
                <p className="mt-2 text-sm text-text-grey">
                  This book, <strong className="text-heading-text-black">"{heldInfo.bookTitle}"</strong>,
                  is on hold for{' '}
                  <strong className="text-heading-text-black">
                    {heldInfo.heldForMemberName}
                  </strong>
                  , but the hold is marked as <strong className="text-heading-text-black">flexible</strong>.
                  Others may check it out for now, though the holder may still ask for it later.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
              <button
                onClick={() => resetForm(false)}
                className="px-5 py-2 text-sm font-semibold text-text-grey bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmHeldCheckout}
                disabled={heldInfo.holdPolicy === 'strict'}
                className={clsx(
                  'px-5 py-2 text-sm font-semibold rounded-lg transition',
                  heldInfo.holdPolicy === 'strict'
                    ? 'bg-primary-dark-grey text-text-grey cursor-not-allowed'
                    : 'text-white bg-dark-green hover:bg-icon-green'
                )}
              >
                Continue Checkout
              </button>
            </div>
          </div>
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
    </>
  )
}