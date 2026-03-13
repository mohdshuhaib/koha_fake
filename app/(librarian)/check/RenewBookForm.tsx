'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  Barcode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Clock3,
  RefreshCcw,
} from 'lucide-react'
import clsx from 'classnames'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const IST = 'Asia/Kolkata'

function toIST(value?: string | Date | dayjs.Dayjs | null) {
  if (!value) return dayjs().tz(IST)
  return dayjs(value).tz(IST)
}

function formatIST(value: string | Date | dayjs.Dayjs, format = 'DD MMM YYYY') {
  return toIST(value).format(format)
}

export default function RenewBookForm() {
  const [bookBarcode, setBookBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [previewData, setPreviewData] = useState<{
    title: string
    dueDate: string
    renewalStartDate: string
    memberName: string
    memberCategory: string
    hasBlockingHold: boolean
  } | null>(null)

  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.matchMedia('(pointer: coarse)').matches
    )
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const resetForm = (clearMessage = false) => {
    setBookBarcode('')
    setPreviewData(null)
    setLoading(false)

    if (clearMessage) {
      setMessage('')
      setIsError(false)
    }

    setTimeout(() => inputRef.current?.focus(), 150)
  }

  const handleRenew = async () => {
    if (!bookBarcode.trim()) return

    setLoading(true)
    setMessage('')
    setIsError(false)
    setPreviewData(null)

    // Step 1: Fetch book by barcode
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, status')
      .eq('barcode', bookBarcode.trim())
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

    // Step 3: Fetch active borrow record + member
    const { data: borrowRecord, error: recordError } = await supabase
      .from('borrow_records')
      .select(`
        id,
        due_date,
        member_id,
        member:member_id(name, category)
      `)
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

    const member = Array.isArray(borrowRecord.member)
      ? borrowRecord.member[0]
      : borrowRecord.member

    if (!member) {
      setMessage('Could not find the member associated with this loan.')
      setIsError(true)
      resetForm()
      return
    }

    // Step 4: Preview renewal timing in IST
    const today = dayjs().tz(IST).startOf('day')
    const dueDate = toIST(borrowRecord.due_date).startOf('day')
    const daysUntilDue = dueDate.diff(today, 'day')
    const renewalStartDate = dueDate.subtract(5, 'day')

    // Step 5: Check for blocking holds
    const { count: blockingHoldCount } = await supabase
      .from('hold_records')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', book.id)
      .eq('released', false)
      .neq('member_id', borrowRecord.member_id)

    const hasBlockingHold = !!blockingHoldCount && blockingHoldCount > 0

    setPreviewData({
      title: book.title,
      dueDate: dueDate.toISOString(),
      renewalStartDate: renewalStartDate.toISOString(),
      memberName: member.name,
      memberCategory: member.category,
      hasBlockingHold,
    })

    // Step 6: Validate before RPC
    if (today.isAfter(dueDate, 'day')) {
      setMessage('This book is overdue. It must be checked in before it can be renewed.')
      setIsError(true)
      resetForm()
      return
    }

    if (daysUntilDue > 5) {
      setMessage(
        `It's too early to renew. This book can be renewed on or after ${renewalStartDate.format('DD MMM YYYY')}.`
      )
      setIsError(true)
      resetForm()
      return
    }

    if (hasBlockingHold) {
      setMessage('This book has an active hold for another member and cannot be renewed.')
      setIsError(true)
      resetForm()
      return
    }

    // Step 7: Final renewal through RPC
    const { data: renewedRows, error: renewError } = await supabase.rpc('renew_book', {
      p_book_id: book.id,
    })

    if (renewError) {
      const msg = renewError.message || 'Failed to renew the book. Please try again.'
      if (msg === 'It is too early to renew this book') {
        setMessage(
          `It's too early to renew. This book can be renewed on or after ${renewalStartDate.format('DD MMM YYYY')}.`
        )
      } else {
        setMessage(msg)
      }
      setIsError(true)
      resetForm()
      return
    }

    const renewed = Array.isArray(renewedRows) ? renewedRows[0] : renewedRows

    if (!renewed) {
      setMessage('Renewal completed, but no updated details were returned.')
      setIsError(false)
      resetForm()
      return
    }

    setMessage(
      `"${renewed.book_title}" renewed for ${renewed.member_name}. New due date: ${formatIST(
        renewed.new_due_date,
        'DD MMM YYYY'
      )}`
    )
    setIsError(false)
    resetForm()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenew()
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">
            Renew a Borrowed Book
          </h2>
          <p className="text-sm text-text-grey">
            Renewal is allowed only within the last 5 days before due date, and not when another member has an active hold.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Barcode className="h-5 w-5 text-text-grey" />
            </div>

            <input
              ref={inputRef}
              type="text"
              className="w-full p-3 pl-12 pr-14 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
              placeholder="Scan book barcode to renew"
              value={bookBarcode}
              onChange={(e) => setBookBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            {isMobileDevice && !loading && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-text-grey hover:text-dark-green hover:bg-secondary-white transition"
                  aria-label="Scan book barcode"
                >
                  <Camera size={18} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleRenew}
            disabled={loading || !bookBarcode}
            className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
          >
            {loading ? 'Renewing...' : 'Renew Book'}
          </button>
        </div>

        {previewData && !message && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
              <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                <RefreshCcw size={14} />
                Book
              </div>
              <p className="mt-2 font-bold text-heading-text-black">{previewData.title}</p>
            </div>

            <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
              <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                <Clock3 size={14} />
                Due Date
              </div>
              <p className="mt-2 font-bold text-heading-text-black">
                {formatIST(previewData.dueDate)}
              </p>
            </div>

            <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
              <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                <Clock3 size={14} />
                Renewal Opens
              </div>
              <p className="mt-2 font-bold text-heading-text-black">
                {formatIST(previewData.renewalStartDate)}
              </p>
            </div>

            <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
              <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                <RefreshCcw size={14} />
                Member
              </div>
              <p className="mt-2 font-bold text-heading-text-black">{previewData.memberName}</p>
              <p className="mt-1 text-xs text-text-grey capitalize">
                {previewData.memberCategory}
                {previewData.hasBlockingHold ? ' • Hold waiting' : ''}
              </p>
            </div>
          </div>
        )}

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

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Book Barcode"
        onScanSuccess={(value) => {
          setBookBarcode(value)
        }}
      />
    </>
  )
}