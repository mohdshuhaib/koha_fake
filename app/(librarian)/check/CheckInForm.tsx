'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

// ✨ Import the necessary calendar components
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export default function CheckInForm() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔄 Renamed state for clarity: controls the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<any | null>(null)
  const [manualHolidays, setManualHolidays] = useState<Date[]>([])

  const handleInitialScan = async () => {
    if (!barcode) return
    setLoading(true)
    setMessage('')
    resetProcess()

    const { data: book } = await supabase
      .from('books')
      .select('id, title')
      .eq('barcode', barcode)
      .single()

    if (!book) {
      setMessage('❌ Book not found')
      setLoading(false)
      return
    }

    const { data: record } = await supabase
      .from('borrow_records')
      .select('*, member:member_id(*)')
      .eq('book_id', book.id)
      .is('return_date', null)
      .single()

    if (!record) {
      setMessage('⚠️ Book is not currently checked out')
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
      setMessage(`📘 Book "${book.title}" is overdue. Please select leave days.`)
      setActiveRecord({ ...record, book })
      setIsModalOpen(true) // 🔄 Open the modal instead of showing an inline element
      setLoading(false)
    } else {
      await handleFinalizeCheckIn({ ...record, book }, [])
    }
  }

  const handleFinalizeCheckIn = async (recordToProcess: any, holidays: Date[]) => {
    setLoading(true)
    setMessage('Processing return...')
    setIsModalOpen(false) // ✨ Close the modal when finalizing

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

    const { error: updateBorrow } = await supabase
      .from('borrow_records')
      .update({ return_date: returnDate.toISOString(), fine })
      .eq('id', recordToProcess.id)

    const { error: updateBook } = await supabase
      .from('books')
      .update({ status: 'available' })
      .eq('id', recordToProcess.book.id)

    if (updateBorrow || updateBook) {
      setMessage('❌ Return failed')
    } else {
      let successMessage = `✅ Returned "${recordToProcess.book.title}" by ${recordToProcess.member.name}.`
      if (fine > 0) successMessage += ` Fine: ₹${fine}.`
      if (holidayCount > 0) successMessage += ` (${holidayCount} leave day(s) excluded.)`
      setMessage(successMessage)
    }
    resetProcess() // Resets all state, including barcode
    setLoading(false)
  }

  const resetProcess = () => {
    setIsModalOpen(false) // 🔄 Make sure modal is closed on reset
    setActiveRecord(null)
    setManualHolidays([])
    setBarcode('')
  }

  const calendarStyles = `
    .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #f59e0b; --rdp-background-color: #e5e7eb; border-radius: 0.5rem; }
    .rdp-caption_label { font-weight: bold; }
    .rdp-nav_button { border-radius: 0.5rem; }
  `

  return (
    <> {/* ✨ Wrap component in a fragment to hold the modal */}
      <div className="space-y-5 mt-10">
        <h2 className="text-2xl font-bold text-heading-text-black uppercase">Check In Book</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey bg-secondary-white text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green"
            placeholder="Scan book barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInitialScan()}
            disabled={isModalOpen} // Disable while modal is open
          />
          <button
            onClick={handleInitialScan}
            disabled={loading || isModalOpen}
            className="bg-button-yellow text-button-text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark-grey transition duration-300 disabled:opacity-50"
          >
            {loading ? '...' : 'Scan'}
          </button>
        </div>
        {message && (
          <p className={`text-sm font-medium pt-1 font-malayalam ${message.includes('❌') ? 'text-red-600' : 'text-text-grey'}`}>
            {message}
          </p>
        )}
      </div>

      {/* ✨ New Modal for Holiday Selection */}
      {isModalOpen && activeRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <style>{calendarStyles}</style>
          <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-heading-text-black text-center">Select College Leave Days</h3>
            <p className="text-sm text-center text-text-grey -mt-2">For book: "{activeRecord.book.title}"</p>

            <div className="flex justify-center bg-gray-50 p-2 rounded-lg">
               <DayPicker
                  mode="multiple"
                  min={1}
                  selected={manualHolidays}
                  onSelect={(days) => setManualHolidays(days || [])}
                  fromDate={new Date(activeRecord.borrow_date)}
                  toDate={new Date()}
                  />
            </div>

            <div className="text-center font-semibold text-text-grey">
              You have selected {manualHolidays.length} leave day(s).
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                  onClick={() => handleFinalizeCheckIn(activeRecord, manualHolidays)}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                  {loading ? 'Processing...' : `Confirm & Check-In`}
              </button>
              <button
                  onClick={resetProcess}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                  Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}