'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Barcode, X, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'classnames'

export default function CheckInForm() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<any | null>(null)
  const [manualHolidays, setManualHolidays] = useState<Date[]>([])

  // --- LOGIC FUNCTIONS (Unchanged) ---
  const handleInitialScan = async () => {
    if (!barcode) return
    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data: book } = await supabase.from('books').select('id, title').eq('barcode', barcode).single()
    if (!book) {
      setMessage('Book not found')
      setIsError(true)
      setLoading(false)
      return
    }

    const { data: record } = await supabase.from('borrow_records').select('*, member:member_id(*)').eq('book_id', book.id).is('return_date', null).single()
    if (!record) {
      setMessage('Book is not currently checked out')
      setIsError(true)
      setLoading(false)
      return
    }

    const returnDate = dayjs()
    const borrowDate = dayjs(record.borrow_date)
    const totalDaysDiff = returnDate.diff(borrowDate, 'day')

    const category = record.member.category || 'student'
    let allowedDays = 15
    if (category === 'teacher') allowedDays = Infinity
    else if (category === 'class') allowedDays = 30

    if (totalDaysDiff > allowedDays) {
      setMessage(`Book "${book.title}" is overdue. Please select any applicable leave days.`)
      setIsError(false)
      setActiveRecord({ ...record, book })
      setIsModalOpen(true)
      setLoading(false)
    } else {
      await handleFinalizeCheckIn({ ...record, book }, [])
    }
  }

  const handleFinalizeCheckIn = async (recordToProcess: any, holidays: Date[]) => {
    setLoading(true)
    setMessage('Processing return...')
    setIsError(false)
    setIsModalOpen(false)

    const returnDate = dayjs()
    const borrowDate = dayjs(recordToProcess.borrow_date)
    const holidayCount = holidays.length
    const totalDaysDiff = returnDate.diff(borrowDate, 'day')
    const effectiveDaysBorrowed = totalDaysDiff - holidayCount

    let fine = 0
    const category = recordToProcess.member.category || 'student'
    let allowedDays = 15
    if (category === 'teacher') allowedDays = Infinity
    else if (category === 'class') allowedDays = 30

    if (effectiveDaysBorrowed > allowedDays) {
      fine = 3 + (effectiveDaysBorrowed - allowedDays - 1)
    }

    const { error: updateBorrow } = await supabase.from('borrow_records').update({ return_date: returnDate.toISOString(), fine }).eq('id', recordToProcess.id)
    const { error: updateBook } = await supabase.from('books').update({ status: 'available' }).eq('id', recordToProcess.book.id)

    if (updateBorrow || updateBook) {
      setMessage('Return failed')
      setIsError(true)
    } else {
      let successMessage = `Returned "${recordToProcess.book.title}" by ${recordToProcess.member.name}.`
      if (fine > 0) successMessage += ` Fine: ₹${fine}.`
      if (holidayCount > 0) successMessage += ` (${holidayCount} leave day(s) excluded.)`
      setMessage(successMessage)
      setIsError(false)
    }
    resetProcess()
    setLoading(false)
  }

  const resetProcess = () => {
    setIsModalOpen(false)
    setActiveRecord(null)
    setManualHolidays([])
    setBarcode('')
  }

  // --- REDESIGNED JSX ---
  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">Check In a Book</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Barcode className="h-5 w-5 text-text-grey" />
            </div>
            <input
              type="text"
              className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
              placeholder="Scan book barcode to return"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInitialScan()}
              disabled={isModalOpen || loading}
            />
          </div>
          <button
            onClick={handleInitialScan}
            disabled={loading || isModalOpen || !barcode}
            className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>

        {message && !isModalOpen && (
          <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
            {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-medium">{message}</span>
          </div>
        )}
      </div>

      {/* --- Redesigned Modal for Holiday Selection --- */}
      {isModalOpen && activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-md border border-primary-dark-grey">
            <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
              <h3 className="font-bold text-lg font-heading text-heading-text-black">Select College Leave Days</h3>
              <button onClick={resetProcess} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-center text-text-grey">
                Book <strong className="text-heading-text-black">"{activeRecord.book.title}"</strong> is overdue. Select any leave days to exclude from the fine calculation.
              </p>

              <div className="flex justify-center bg-primary-grey p-2 rounded-lg border border-primary-dark-grey">
                <DayPicker
                  mode="multiple"
                  min={1}
                  selected={manualHolidays}
                  onSelect={(days) => setManualHolidays(days || [])}
                  fromDate={new Date(activeRecord.borrow_date)}
                  toDate={new Date()}
                  classNames={{
                    root: 'text-text-grey',
                    caption_label: 'font-bold font-heading text-heading-text-black',
                    head_cell: 'font-semibold',
                    day_selected: 'bg-button-yellow text-button-text-black font-bold rounded-full',
                    day_today: 'font-bold text-dark-green',
                  }}
                />
              </div>

              <div className="text-center font-semibold text-text-grey">
                You have selected {manualHolidays.length} leave day(s).
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button onClick={resetProcess} className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition">
                  Cancel
                </button>
                <button onClick={() => handleFinalizeCheckIn(activeRecord, manualHolidays)} disabled={loading} className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition">
                  {loading ? 'Processing...' : `Confirm & Check In`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}