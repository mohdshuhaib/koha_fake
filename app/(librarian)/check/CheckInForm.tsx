'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { CustomDayPicker } from '@/components/CustomDayPicker'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import 'react-day-picker/dist/style.css'
import {
  Barcode,
  X,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Camera,
  RotateCcw,
  BookOpen,
  Clock3,
  IndianRupee,
  BookMarked,
  ShieldCheck,
} from 'lucide-react'
import clsx from 'classnames'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const IST = 'Asia/Kolkata'

type HolidayRow = {
  leave_date: string
}

type ActiveReturnRecord = {
  id: string
  borrow_date: string
  due_date: string | null
  member: {
    id: string
    name: string
    barcode: string
    category: 'student' | 'teacher' | 'outside' | 'class'
  }
  book: {
    id: string
    title: string
    barcode: string
    pages: number | null
  }
  savedHolidays: HolidayRow[]
  isOverdue: boolean
  overdueDaysBeforePersonal: number
}

function toIST(value?: string | Date | dayjs.Dayjs | null) {
  if (!value) return dayjs().tz(IST)
  return dayjs(value).tz(IST)
}

function parseISTDateKey(dateKey: string) {
  return dayjs.tz(dateKey, 'YYYY-MM-DD', IST)
}

function toISTDateKey(value: string | Date | dayjs.Dayjs) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseISTDateKey(value).format('YYYY-MM-DD')
  }
  return toIST(value).format('YYYY-MM-DD')
}

function formatIST(value: string | Date | dayjs.Dayjs, format = 'DD MMM YYYY') {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseISTDateKey(value).format(format)
  }
  return toIST(value).format(format)
}

function getAllowedDays(category?: string | null) {
  if (category === 'student') return 15
  if (category === 'teacher' || category === 'outside' || category === 'class') return 30
  return 15
}

function getFallbackDueDateKey(borrowDate: string, category?: string | null) {
  const allowedDays = getAllowedDays(category)
  return toIST(borrowDate).startOf('day').add(allowedDays, 'day').format('YYYY-MM-DD')
}

export default function CheckInForm() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [activeRecord, setActiveRecord] = useState<ActiveReturnRecord | null>(null)
  const [manualHolidays, setManualHolidays] = useState<Date[]>([])

  const [pagesReadInput, setPagesReadInput] = useState('')
  const [isFullRead, setIsFullRead] = useState(false)
  const [totalPagesInput, setTotalPagesInput] = useState('')

  const [isGlobalLeaveModalOpen, setIsGlobalLeaveModalOpen] = useState(false)
  const [globalHolidays, setGlobalHolidays] = useState<Date[]>([])
  const [globalHolidaysLoading, setGlobalHolidaysLoading] = useState(false)
  const [isResetGlobalLeavesModalOpen, setIsResetGlobalLeavesModalOpen] = useState(false)

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

  useEffect(() => {
    if (!activeRecord) {
      setManualHolidays([])
      setPagesReadInput('')
      setIsFullRead(false)
      setTotalPagesInput('')
      return
    }

    setManualHolidays([])
    setPagesReadInput('')
    setIsFullRead(false)
    setTotalPagesInput(activeRecord.book.pages ? String(activeRecord.book.pages) : '')
  }, [activeRecord])

  const fetchGlobalHolidays = async () => {
    const { data, error } = await supabase
      .from('holidays')
      .select('leave_date')
      .order('leave_date', { ascending: true })

    if (error) {
      setMessage('Failed to load global leave days.')
      setIsError(true)
      return []
    }

    return data ?? []
  }

  const fetchAndSetGlobalHolidays = async () => {
    setGlobalHolidaysLoading(true)
    const data = await fetchGlobalHolidays()
    setGlobalHolidays(
      data.map((d) => parseISTDateKey(d.leave_date).toDate())
    )
    setGlobalHolidaysLoading(false)
  }

  const openGlobalLeaveModal = async () => {
    await fetchAndSetGlobalHolidays()
    setIsGlobalLeaveModalOpen(true)
  }

  const getOverdueWindowGlobalHolidays = async (dueDateKey: string, returnDateKey: string) => {
    if (parseISTDateKey(returnDateKey).isSameOrBefore(parseISTDateKey(dueDateKey), 'day')) {
      return []
    }

    const overdueStartKey = parseISTDateKey(dueDateKey).add(1, 'day').format('YYYY-MM-DD')

    const { data, error } = await supabase
      .from('holidays')
      .select('leave_date')
      .gte('leave_date', overdueStartKey)
      .lte('leave_date', returnDateKey)
      .order('leave_date', { ascending: true })

    if (error) return []

    return (data ?? []).filter((h) => {
      const hDay = parseISTDateKey(h.leave_date)
      return (
        hDay.isSameOrAfter(parseISTDateKey(overdueStartKey), 'day') &&
        hDay.isSameOrBefore(parseISTDateKey(returnDateKey), 'day')
      )
    })
  }

  const buildFineComputation = (
    recordToProcess: ActiveReturnRecord,
    savedHolidays: HolidayRow[],
    personalHolidays: Date[]
  ) => {
    const todayKey = dayjs().tz(IST).format('YYYY-MM-DD')
    const dueDateKey =
      recordToProcess.due_date
        ? toISTDateKey(recordToProcess.due_date)
        : getFallbackDueDateKey(recordToProcess.borrow_date, recordToProcess.member.category)

    const dueDay = parseISTDateKey(dueDateKey)
    const returnDay = parseISTDateKey(todayKey)

    if (returnDay.isSameOrBefore(dueDay, 'day')) {
      return {
        fine: 0,
        effectiveOverdueDays: 0,
        totalExcludedDays: 0,
        dueDateKey,
        returnDateKey: todayKey,
      }
    }

    const overdueDays = returnDay.diff(dueDay, 'day')

    const overdueStartKey = dueDay.add(1, 'day').format('YYYY-MM-DD')
    const globalDates = savedHolidays.map((d) => d.leave_date)
    const personalDates = personalHolidays
      .map((d) => toISTDateKey(d))
      .filter((key) => {
        const day = parseISTDateKey(key)
        return day.isSameOrAfter(parseISTDateKey(overdueStartKey), 'day') &&
          day.isSameOrBefore(returnDay, 'day')
      })

    const allUniqueExcludedDates = new Set([...globalDates, ...personalDates])
    const totalExcludedDays = allUniqueExcludedDates.size
    const effectiveOverdueDays = Math.max(overdueDays - totalExcludedDays, 0)

    let fine = 0
    if (effectiveOverdueDays > 0) {
      fine = 3 + (effectiveOverdueDays - 1)
    }

    return {
      fine,
      effectiveOverdueDays,
      totalExcludedDays,
      dueDateKey,
      returnDateKey: todayKey,
    }
  }

  const getPagesReadPayload = () => {
    if (!activeRecord) {
      return {
        pagesRead: null as number | null,
        totalPagesToSave: null as number | null,
        error: 'No active record found.',
      }
    }

    const bookPages = activeRecord.book.pages

    if (isFullRead) {
      if (bookPages && bookPages > 0) {
        return {
          pagesRead: bookPages,
          totalPagesToSave: null,
          error: null,
        }
      }

      const totalPages = Number(totalPagesInput)
      if (!Number.isInteger(totalPages) || totalPages <= 0) {
        return {
          pagesRead: null,
          totalPagesToSave: null,
          error: 'Enter the total pages for this book to mark it as fully read.',
        }
      }

      return {
        pagesRead: totalPages,
        totalPagesToSave: totalPages,
        error: null,
      }
    }

    const pagesRead = Number(pagesReadInput)
    if (!Number.isInteger(pagesRead) || pagesRead < 0) {
      return {
        pagesRead: null,
        totalPagesToSave: null,
        error: 'Enter a valid number of pages read.',
      }
    }

    if (bookPages && pagesRead > bookPages) {
      return {
        pagesRead: null,
        totalPagesToSave: null,
        error: `Pages read cannot be more than total pages (${bookPages}).`,
      }
    }

    return {
      pagesRead,
      totalPagesToSave: null,
      error: null,
    }
  }

  const handleInitialScan = async () => {
    if (!barcode.trim()) return

    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, barcode, pages')
      .eq('barcode', barcode.trim())
      .single()

    if (bookError || !book) {
      setMessage('Book not found with that barcode.')
      setIsError(true)
      setLoading(false)
      resetProcess(false)
      return
    }

    const { data: record, error: recordError } = await supabase
      .from('borrow_records')
      .select(`
        id,
        borrow_date,
        due_date,
        member:member_id(id, name, barcode, category)
      `)
      .eq('book_id', book.id)
      .is('return_date', null)
      .single()

    if (recordError || !record) {
      setMessage('This book is not currently checked out.')
      setIsError(true)
      setLoading(false)
      resetProcess(false)
      return
    }

    const memberData = Array.isArray(record.member) ? record.member[0] : record.member
    const dueDateKey = record.due_date
      ? toISTDateKey(record.due_date)
      : getFallbackDueDateKey(record.borrow_date, memberData?.category)

    const todayKey = dayjs().tz(IST).format('YYYY-MM-DD')
    const overdueGlobalHolidays = await getOverdueWindowGlobalHolidays(dueDateKey, todayKey)

    const tempRecord: ActiveReturnRecord = {
      ...record,
      member: memberData,
      book,
      savedHolidays: overdueGlobalHolidays,
      isOverdue: false,
      overdueDaysBeforePersonal: 0,
    }

    const preview = buildFineComputation(tempRecord, overdueGlobalHolidays, [])
    const isOverdue = preview.effectiveOverdueDays > 0 || parseISTDateKey(todayKey).isAfter(parseISTDateKey(dueDateKey), 'day')

    setActiveRecord({
      ...tempRecord,
      isOverdue,
      overdueDaysBeforePersonal: preview.effectiveOverdueDays,
    })

    setMessage(
      isOverdue
        ? `This return is overdue based on the due date. Review leave days and reading details before check-in.`
        : `Review reading details and confirm check-in for "${book.title}".`
    )
    setIsError(false)
    setLoading(false)
  }

  const handleConfirmCheckIn = async () => {
    if (!activeRecord) return

    const pagesPayload = getPagesReadPayload()
    if (pagesPayload.error || pagesPayload.pagesRead === null) {
      setMessage(pagesPayload.error || 'Pages read is required.')
      setIsError(true)
      return
    }

    const computation = buildFineComputation(
      activeRecord,
      activeRecord.savedHolidays,
      manualHolidays
    )

    setLoading(true)
    setMessage('Processing return...')
    setIsError(false)

    const returnDateISO = dayjs().tz(IST).toISOString()

    const { error } = await supabase.rpc('checkin_book', {
      p_borrow_record_id: activeRecord.id,
      p_book_id: activeRecord.book.id,
      p_return_date: returnDateISO,
      p_fine: computation.fine,
      p_pages_read: pagesPayload.pagesRead,
      p_total_pages: pagesPayload.totalPagesToSave,
    })

    if (error) {
      setMessage(error.message || 'The check-in process failed. Please try again.')
      setIsError(true)
      setLoading(false)
      return
    }

    let successMessage = `Returned "${activeRecord.book.title}" by ${activeRecord.member.name}.`
    if (pagesPayload.pagesRead >= 0) successMessage += ` Pages read: ${pagesPayload.pagesRead}.`
    if (computation.fine > 0) successMessage += ` Fine: ₹${computation.fine}.`
    if (computation.totalExcludedDays > 0) {
      successMessage += ` (${computation.totalExcludedDays} leave day(s) excluded from overdue count.)`
    }

    setMessage(successMessage)
    setIsError(false)
    resetProcess(true)
  }

  const handleSaveGlobalHolidays = async () => {
    setGlobalHolidaysLoading(true)
    setMessage('')
    setIsError(false)

    const selectedDateKeys = Array.from(
      new Set(globalHolidays.map((d) => toISTDateKey(d)))
    ).sort()

    const existingRows = await fetchGlobalHolidays()
    const existingDateKeys = existingRows.map((row) => row.leave_date)

    const toInsert = selectedDateKeys.filter((d) => !existingDateKeys.includes(d))
    const toDelete = existingDateKeys.filter((d) => !selectedDateKeys.includes(d))

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('holidays')
        .delete()
        .in('leave_date', toDelete)

      if (deleteError) {
        setMessage('Failed to remove some global leave days.')
        setIsError(true)
        setGlobalHolidaysLoading(false)
        return
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('holidays')
        .insert(toInsert.map((leave_date) => ({ leave_date })))

      if (insertError) {
        setMessage('Failed to save some global leave days. Please check for duplicates.')
        setIsError(true)
        setGlobalHolidaysLoading(false)
        return
      }
    }

    setMessage(
      toInsert.length === 0 && toDelete.length === 0
        ? 'No changes were made to global leave days.'
        : 'Global leave days have been updated successfully.'
    )
    setIsError(false)
    setGlobalHolidaysLoading(false)
    setIsGlobalLeaveModalOpen(false)
  }

  const handleResetGlobalHolidays = async () => {
    setGlobalHolidaysLoading(true)
    setMessage('')
    setIsError(false)

    const existingRows = await fetchGlobalHolidays()
    const existingDateKeys = existingRows.map((row) => row.leave_date)

    if (existingDateKeys.length > 0) {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .in('leave_date', existingDateKeys)

      if (error) {
        setMessage('Failed to clear global leave days.')
        setIsError(true)
        setGlobalHolidaysLoading(false)
        return
      }
    }

    setGlobalHolidays([])
    setIsResetGlobalLeavesModalOpen(false)
    setIsGlobalLeaveModalOpen(false)
    setGlobalHolidaysLoading(false)
    setMessage('All global leave days have been cleared.')
    setIsError(false)
  }

  const resetProcess = (clearBarcode = false) => {
    setActiveRecord(null)
    setManualHolidays([])
    setPagesReadInput('')
    setIsFullRead(false)
    setTotalPagesInput('')
    if (clearBarcode) setBarcode('')
    setLoading(false)

    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const fullReset = () => {
    resetProcess(true)
    setMessage('')
    setIsError(false)
  }

  const globalDatesForReturnModal = activeRecord?.savedHolidays.map((h) =>
    parseISTDateKey(h.leave_date).toDate()
  ) ?? []

  const sortedGlobalHolidayDateKeys = Array.from(
    new Set(globalHolidays.map((d) => toISTDateKey(d)))
  ).sort()

  const computedPreview = activeRecord
    ? buildFineComputation(activeRecord, activeRecord.savedHolidays, manualHolidays)
    : null

  const dueDateLabel = activeRecord
    ? (activeRecord.due_date
        ? toISTDateKey(activeRecord.due_date)
        : getFallbackDueDateKey(activeRecord.borrow_date, activeRecord.member.category))
    : null

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">
            Check In a Book
          </h2>

          <button
            onClick={openGlobalLeaveModal}
            className="flex items-center gap-2 text-sm font-semibold text-dark-green hover:text-icon-green transition flex-shrink-0"
          >
            <CalendarDays size={16} /> Manage Global Leaves
          </button>
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
              placeholder="Scan book barcode to return"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInitialScan()}
              disabled={!!activeRecord || loading}
            />

            {isMobileDevice && !loading && !activeRecord && (
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
            onClick={handleInitialScan}
            disabled={loading || !!activeRecord || !barcode}
            className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>

        {message && !activeRecord && (
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

      {/* Return Details Modal */}
      {activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-4xl border border-primary-dark-grey max-h-[92vh] overflow-hidden">
            <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg font-heading text-heading-text-black">
                  Confirm Book Return
                </h3>
                <p className="text-sm text-text-grey mt-1">
                  Review the return details, leave adjustments, and reading progress.
                </p>
              </div>
              <button
                onClick={fullReset}
                className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                  <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                    <BookMarked size={14} />
                    Book
                  </div>
                  <p className="mt-2 font-bold text-heading-text-black">{activeRecord.book.title}</p>
                  <p className="text-xs text-text-grey mt-1">{activeRecord.book.barcode}</p>
                </div>

                <div className="rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                  <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                    <ShieldCheck size={14} />
                    Member
                  </div>
                  <p className="mt-2 font-bold text-heading-text-black">{activeRecord.member.name}</p>
                  <p className="text-xs text-text-grey mt-1">
                    {activeRecord.member.barcode} • {activeRecord.member.category}
                  </p>
                </div>

                <div className="rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                  <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                    <Clock3 size={14} />
                    Borrowed On
                  </div>
                  <p className="mt-2 font-bold text-heading-text-black">
                    {formatIST(activeRecord.borrow_date)}
                  </p>
                </div>

                <div className="rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                  <div className="flex items-center gap-2 text-text-grey text-xs uppercase font-semibold">
                    <CalendarDays size={14} />
                    Due Date
                  </div>
                  <p className="mt-2 font-bold text-heading-text-black">
                    {dueDateLabel ? formatIST(dueDateLabel) : '-'}
                  </p>
                </div>
              </div>

              {computedPreview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={clsx(
                      'rounded-xl border p-4',
                      computedPreview.effectiveOverdueDays > 0
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    )}
                  >
                    <p className="text-xs uppercase font-semibold text-text-grey">Overdue Days</p>
                    <p className="mt-2 text-2xl font-bold text-heading-text-black">
                      {computedPreview.effectiveOverdueDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                    <p className="text-xs uppercase font-semibold text-text-grey">Excluded Leave Days</p>
                    <p className="mt-2 text-2xl font-bold text-heading-text-black">
                      {computedPreview.totalExcludedDays}
                    </p>
                  </div>

                  <div
                    className={clsx(
                      'rounded-xl border p-4',
                      computedPreview.fine > 0
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    )}
                  >
                    <p className="text-xs uppercase font-semibold text-text-grey">Fine</p>
                    <p className="mt-2 text-2xl font-bold text-heading-text-black">
                      ₹{computedPreview.fine}
                    </p>
                  </div>
                </div>
              )}

              {activeRecord.isOverdue && (
                <div className="space-y-4 rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                  <div>
                    <h4 className="font-bold text-heading-text-black">Personal Leave Days</h4>
                    <p className="text-sm text-text-grey mt-1">
                      Select any additional personal leave days that should be excluded from overdue fine calculation.
                      Global leave days are already locked and highlighted.
                    </p>
                  </div>

                  <div className="rounded-lg border border-primary-dark-grey bg-secondary-white p-2 sm:p-4 flex flex-col items-center">
                    <CustomDayPicker
                      mode="multiple"
                      selected={manualHolidays}
                      onSelect={(days) => setManualHolidays(days || [])}
                      fromDate={toIST(activeRecord.borrow_date).toDate()}
                      toDate={dayjs().tz(IST).toDate()}
                      disabled={globalDatesForReturnModal}
                      modifiers={{ globalHoliday: globalDatesForReturnModal }}
                      modifiersClassNames={{
                        globalHoliday:
                          'bg-red-100 text-red-700 font-bold hover:bg-red-100 cursor-not-allowed',
                      }}
                    />

                    <div className="flex flex-wrap gap-4 text-xs mt-3 justify-center">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span>
                        Global Leave
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-button-yellow border border-yellow-500"></span>
                        Personal Leave
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-text-grey font-medium text-center">
                    Selected personal leave days: {manualHolidays.length}
                  </p>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-primary-dark-grey bg-primary-grey p-4">
                <div>
                  <h4 className="font-bold text-heading-text-black">Reading Progress</h4>
                  <p className="text-sm text-text-grey mt-1">
                    Record how many pages the member read before returning the book.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-heading-text-black">
                  <input
                    type="checkbox"
                    checked={isFullRead}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIsFullRead(checked)
                      if (checked && activeRecord.book.pages) {
                        setPagesReadInput(String(activeRecord.book.pages))
                      }
                    }}
                    className="accent-green-700"
                  />
                  Full read
                </label>

                {isFullRead ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeRecord.book.pages ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-text-grey">Total book pages</p>
                        <p className="mt-1 text-xl font-bold text-heading-text-black">
                          {activeRecord.book.pages}
                        </p>
                        <p className="mt-2 text-sm text-text-grey">
                          Pages read will be saved as {activeRecord.book.pages}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-heading-text-black">
                          Enter total pages of this book
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={totalPagesInput}
                          onChange={(e) => setTotalPagesInput(e.target.value)}
                          className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
                          placeholder="Enter total pages"
                        />
                        <p className="text-xs text-text-grey">
                          Since this book has no saved page count, this will update the book’s total pages and also save it as fully read.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-heading-text-black">
                        Pages read
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={pagesReadInput}
                        onChange={(e) => setPagesReadInput(e.target.value)}
                        className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
                        placeholder="Enter pages read"
                      />
                    </div>

                    <div className="rounded-lg border border-primary-dark-grey bg-secondary-white p-4">
                      <p className="text-sm text-text-grey">Saved total pages</p>
                      <p className="mt-1 text-xl font-bold text-heading-text-black">
                        {activeRecord.book.pages ?? 'Not set'}
                      </p>
                      <p className="mt-2 text-xs text-text-grey">
                        If total pages are saved, pages read cannot exceed that number.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={fullReset}
                  className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCheckIn}
                  disabled={loading}
                  className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition disabled:opacity-70"
                >
                  {loading ? 'Processing...' : 'Confirm & Check In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Leave Modal */}
      {isGlobalLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-6xl border border-primary-dark-grey max-h-[94vh] overflow-hidden">
            <div className="p-5 border-b border-primary-dark-grey flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl font-heading text-heading-text-black">
                  Manage Global Leave Days
                </h3>
                <p className="text-sm text-text-grey mt-1">
                  These official leave dates are automatically excluded from overdue fine calculations.
                </p>
              </div>
              <button
                onClick={() => setIsGlobalLeaveModalOpen(false)}
                className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(94vh-88px)]">
              {globalHolidaysLoading ? (
                <div className="text-center p-12 text-text-grey">Loading global leave days...</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
                        <p className="text-xs uppercase font-semibold text-text-grey">Total Selected</p>
                        <p className="mt-2 text-2xl font-bold text-heading-text-black">
                          {sortedGlobalHolidayDateKeys.length}
                        </p>
                      </div>
                      <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
                        <p className="text-xs uppercase font-semibold text-text-grey">First Leave</p>
                        <p className="mt-2 text-lg font-bold text-heading-text-black">
                          {sortedGlobalHolidayDateKeys[0]
                            ? formatIST(sortedGlobalHolidayDateKeys[0])
                            : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
                        <p className="text-xs uppercase font-semibold text-text-grey">Last Leave</p>
                        <p className="mt-2 text-lg font-bold text-heading-text-black">
                          {sortedGlobalHolidayDateKeys.length > 0
                            ? formatIST(sortedGlobalHolidayDateKeys[sortedGlobalHolidayDateKeys.length - 1])
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-3 sm:p-5">
                      <div className="mb-4">
                        <h4 className="font-bold text-heading-text-black">Pick Official Leave Days</h4>
                        <p className="text-sm text-text-grey mt-1">
                          Select every official college leave date. All calculations use IST dates.
                        </p>
                      </div>

                      <div className="bg-secondary-white rounded-lg border border-primary-dark-grey p-2 sm:p-4 flex justify-center overflow-x-auto">
                        <CustomDayPicker
                          mode="multiple"
                          selected={globalHolidays}
                          onSelect={(days) => setGlobalHolidays(days || [])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-heading-text-black">Selected Leave Dates</h4>
                          <p className="text-sm text-text-grey mt-1">
                            Sorted automatically in order.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsResetGlobalLeavesModalOpen(true)}
                          disabled={sortedGlobalHolidayDateKeys.length === 0}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <RotateCcw size={15} />
                          Reset All
                        </button>
                      </div>

                      <div className="mt-4 max-h-[420px] overflow-y-auto space-y-2">
                        {sortedGlobalHolidayDateKeys.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-primary-dark-grey bg-secondary-white p-6 text-center text-sm text-text-grey">
                            No global leave days selected yet.
                          </div>
                        ) : (
                          sortedGlobalHolidayDateKeys.map((dateKey, index) => (
                            <div
                              key={dateKey}
                              className="flex items-center justify-between rounded-lg border border-primary-dark-grey bg-secondary-white px-4 py-3"
                            >
                              <div>
                                <p className="font-semibold text-heading-text-black">
                                  {formatIST(dateKey, 'DD MMM YYYY')}
                                </p>
                                <p className="text-xs text-text-grey">
                                  {formatIST(dateKey, 'dddd')}
                                </p>
                              </div>
                              <div className="text-xs font-bold text-text-grey">
                                #{index + 1}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        onClick={() => setIsGlobalLeaveModalOpen(false)}
                        className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleSaveGlobalHolidays}
                        disabled={globalHolidaysLoading}
                        className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition disabled:opacity-70"
                      >
                        {globalHolidaysLoading ? 'Saving...' : 'Save Global Leaves'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Global Leaves Confirmation Modal */}
      {isResetGlobalLeavesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-2xl border border-primary-dark-grey overflow-hidden">
            <div className="p-5 border-b border-primary-dark-grey">
              <h3 className="font-bold text-xl font-heading text-heading-text-black">
                Clear All Global Leave Days?
              </h3>
              <p className="text-sm text-text-grey mt-1">
                This will remove all currently saved global leave days from the system.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-primary-grey border border-primary-dark-grey p-4">
                <p className="text-sm font-semibold text-heading-text-black mb-3">
                  Dates to be removed ({sortedGlobalHolidayDateKeys.length})
                </p>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {sortedGlobalHolidayDateKeys.map((dateKey, index) => (
                    <div
                      key={dateKey}
                      className="flex items-center justify-between rounded-lg border border-primary-dark-grey bg-secondary-white px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-heading-text-black">
                          {formatIST(dateKey, 'DD MMM YYYY')}
                        </p>
                        <p className="text-xs text-text-grey">
                          {formatIST(dateKey, 'dddd')}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-text-grey">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsResetGlobalLeavesModalOpen(false)}
                  className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetGlobalHolidays}
                  disabled={globalHolidaysLoading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-70"
                >
                  {globalHolidaysLoading ? 'Clearing...' : 'Clear All Leave Days'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Book Barcode"
        onScanSuccess={(value) => {
          setBarcode(value)
        }}
      />
    </>
  )
}