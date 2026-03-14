'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  User,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  LibraryBig,
} from 'lucide-react'

type HeldRecord = {
  id: string
  hold_date: string
  hold_policy: 'strict' | 'flexible'
  book: {
    id: string
    title: string
    barcode: string
  }
  member: {
    id: string
    name: string
    barcode: string
  }
}

export default function HeldBooksList() {
  const [records, setRecords] = useState<HeldRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [releasingId, setReleasingId] = useState<string | null>(null)

  const fetchHeldBooks = async () => {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('hold_records')
      .select(`
        id,
        hold_date,
        hold_policy,
        book:books!inner(id, title, barcode),
        member:members!inner(id, name, barcode)
      `)
      .eq('released', false)
      .order('hold_date', { ascending: true })

    if (error) {
      console.error(error)
      setMessage('Failed to load held books.')
    } else {
      setRecords((data as any) ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchHeldBooks()
  }, [])

  const releaseBook = async (record: HeldRecord) => {
    setReleasingId(record.id)
    setMessage('')

    const { error } = await supabase.rpc('release_held_book', {
      p_hold_id: record.id,
      p_book_id: record.book.id,
    })

    if (error) {
      console.error(error)
      setMessage(`Failed to release "${record.book.title}". Please try again.`)
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== record.id))
    }

    setReleasingId(null)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="rounded-2xl border border-primary-dark-grey bg-primary-grey px-4 py-10 text-center">
          <p className="text-sm sm:text-base text-text-grey">Loading held books...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-primary-dark-grey bg-primary-grey px-4 py-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-3 text-lg font-semibold text-heading-text-black">
            All Clear!
          </h3>
          <p className="mt-1 text-sm text-text-grey">
            There are no books currently on hold.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {records.map((r) => {
            const isStrict = r.hold_policy === 'strict'
            const isLoading = releasingId === r.id

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-primary-dark-grey bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 p-4 sm:p-5">
                  {/* Top section */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      {/* Book title */}
                      <div className="min-w-0">
                        <div className="mb-1 flex items-start gap-2">
                          <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-dark-green" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-text-grey">
                              Book Title
                            </p>
                            <h3 className="break-words font-malayalam text-base sm:text-lg font-semibold leading-6 text-heading-text-black">
                              {r.book.title}
                            </h3>
                          </div>
                        </div>

                        <div className="pl-7">
                          <p className="text-sm text-text-grey break-all">
                            Book Barcode:{' '}
                            <span className="font-medium text-heading-text-black">
                              {r.book.barcode}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-primary-grey/60 p-3">
                          <div className="flex items-start gap-3">
                            <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-dark-green" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-text-grey">
                                Held For
                              </p>
                              <p className="break-words text-sm font-semibold text-heading-text-black">
                                {r.member.name}
                              </p>
                              <p className="text-xs text-text-grey break-all">
                                Member Barcode: {r.member.barcode}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-primary-grey/60 p-3">
                          <div className="flex items-start gap-3">
                            <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-dark-green" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-text-grey">
                                Hold Date
                              </p>
                              <p className="text-sm font-semibold text-heading-text-black">
                                {formatDate(r.hold_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hold policy */}
                      <div className="rounded-xl border border-primary-dark-grey bg-primary-grey/40 p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          {isStrict ? (
                            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                          ) : (
                            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-heading-text-black">
                                Hold Policy
                              </p>

                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isStrict
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {isStrict ? 'Mandatory Hold' : 'Flexible Hold'}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-text-grey">
                              {isStrict
                                ? 'This book cannot be issued to anyone else until this hold is released.'
                                : 'This book may still be issued temporarily, while keeping the hold request active for the member.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action area */}
                    <div className="w-full lg:w-auto lg:min-w-[180px]">
                      <div className="rounded-xl bg-primary-grey/50 p-3 lg:p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <LibraryBig className="h-4 w-4 text-dark-green" />
                          <p className="text-sm font-semibold text-heading-text-black">
                            Action
                          </p>
                        </div>

                        <button
                          onClick={() => releaseBook(r)}
                          disabled={!!releasingId}
                          className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-70"
                        >
                          {isLoading ? 'Releasing...' : 'Mark Available'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{message}</p>
        </div>
      )}
    </div>
  )
}