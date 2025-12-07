'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { CustomDayPicker } from '@/components/CustomDayPicker'
import 'react-day-picker/dist/style.css'
import { Barcode, X, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react'
import clsx from 'classnames'

// --- Main Component ---
export default function CheckInForm() {
    const [barcode, setBarcode] = useState('')
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeRecord, setActiveRecord] = useState<any | null>(null)
    const [manualHolidays, setManualHolidays] = useState<Date[]>([])
    const [isGlobalLeaveModalOpen, setIsGlobalLeaveModalOpen] = useState(false)
    const [globalHolidays, setGlobalHolidays] = useState<Date[]>([])
    const [globalHolidaysLoading, setGlobalHolidaysLoading] = useState(false)

    // Ref for the input field
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input on initial load
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleInitialScan = async () => {
        if (!barcode) return
        setLoading(true)
        setMessage('')
        setIsError(false)

        const { data: book } = await supabase.from('books').select('id, title').eq('barcode', barcode).single()
        if (!book) {
            setMessage('Book not found with that barcode.')
            setIsError(true)
            setLoading(false)
            resetProcess(false)
            return
        }

        const { data: record } = await supabase.from('borrow_records').select('*, member:member_id(*)').eq('book_id', book.id).is('return_date', null).single()
        if (!record) {
            setMessage('This book is not currently checked out.')
            setIsError(true)
            setLoading(false)
            resetProcess(false)
            return
        }

        const returnDate = dayjs()
        const borrowDate = dayjs(record.borrow_date)
        const totalDaysDiff = returnDate.diff(borrowDate, 'day')

        const { data: savedHolidays } = await supabase
            .from('holidays')
            .select('leave_date')
            .gte('leave_date', borrowDate.format('YYYY-MM-DD'))
            .lte('leave_date', returnDate.format('YYYY-MM-DD'))

        const globalHolidayCount = savedHolidays?.length || 0
        const effectiveDaysAfterGlobal = totalDaysDiff - globalHolidayCount

        const memberData = Array.isArray(record.member) ? record.member[0] : record.member;
        const category = memberData?.category || 'student'
        let allowedDays = 15
        if (category === 'teacher') allowedDays = Infinity
        else if (category === 'class') allowedDays = 30

        if (effectiveDaysAfterGlobal > allowedDays) {
            setMessage(`Book "${book.title}" is overdue after considering ${globalHolidayCount} global leave day(s). Please select any additional personal leave days.`)
            setIsError(false)
            // Save the fetched global holidays into activeRecord to use in the modal later
            setActiveRecord({ ...record, member: memberData, book, savedHolidays: savedHolidays || [] })
            setLoading(false)
        } else {
            await handleFinalizeCheckIn({ ...record, member: memberData, book }, savedHolidays || [], [])
        }
    }

    const handleFinalizeCheckIn = async (recordToProcess: any, savedHolidays: { leave_date: string }[], personalHolidays: Date[]) => {
        setLoading(true)
        setMessage('Processing return...')
        setIsError(false)
        setActiveRecord(null)

        const returnDate = dayjs()
        const borrowDate = dayjs(recordToProcess.borrow_date)
        const totalDaysDiff = returnDate.diff(borrowDate, 'day')

        const globalDates = savedHolidays.map(d => d.leave_date)
        const personalDates = personalHolidays.map(d => dayjs(d).format('YYYY-MM-DD'))
        const allUniqueHolidays = new Set([...globalDates, ...personalDates])
        const totalHolidayCount = allUniqueHolidays.size

        const effectiveDaysBorrowed = totalDaysDiff - totalHolidayCount

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
            setMessage('The check-in process failed. Please try again.')
            setIsError(true)
        } else {
            let successMessage = `Returned "${recordToProcess.book.title}" by ${recordToProcess.member.name}.`
            if (fine > 0) successMessage += ` Fine: ₹${fine}.`
            if (totalHolidayCount > 0) successMessage += ` (${totalHolidayCount} total leave day(s) excluded.)`
            setMessage(successMessage)
            setIsError(false)
        }
        resetProcess(true)
    }

    const fetchAndSetGlobalHolidays = async () => {
        setGlobalHolidaysLoading(true);
        const { data } = await supabase.from('holidays').select('leave_date');
        if (data) {
            setGlobalHolidays(data.map(d => dayjs(d.leave_date).toDate()));
        }
        setGlobalHolidaysLoading(false);
    }

    const openGlobalLeaveModal = () => {
        fetchAndSetGlobalHolidays();
        setIsGlobalLeaveModalOpen(true);
    }

    const handleSaveGlobalHolidays = async () => {
        setGlobalHolidaysLoading(true);
        const formattedDates = globalHolidays.map(d => ({ leave_date: dayjs(d).format('YYYY-MM-DD') }));

        await supabase.from('holidays').delete().neq('leave_date', '1900-01-01');
        const { error } = await supabase.from('holidays').insert(formattedDates);

        if (error) {
            setMessage('Failed to save global holidays. Please ensure no duplicate dates are selected.')
            setIsError(true)
            console.error(error);
        } else {
            setMessage('Global leave days have been updated successfully.')
            setIsError(false)
            setIsGlobalLeaveModalOpen(false);
        }
        setGlobalHolidaysLoading(false);
    }

    const resetProcess = (clearBarcode = false) => {
        setActiveRecord(null)
        setManualHolidays([])
        if (clearBarcode) setBarcode('')
        setLoading(false)
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }

    const fullReset = () => {
        resetProcess(true);
        setMessage('');
        setIsError(false);
    }

    // Helper to extract Global Dates for the active modal
    const getGlobalDatesForModal = () => {
        if (!activeRecord || !activeRecord.savedHolidays) return [];
        return activeRecord.savedHolidays.map((h: any) => dayjs(h.leave_date).toDate());
    }

    const globalDatesForDisplay = getGlobalDatesForModal();

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">Check In a Book</h2>
                    <button onClick={openGlobalLeaveModal} className="flex items-center gap-2 text-sm font-semibold text-dark-green hover:text-icon-green transition flex-shrink-0">
                        <CalendarDays size={16} /> Manage Global Leaves
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Barcode className="h-5 w-5 text-text-grey" /></div>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
                            placeholder="Scan book barcode to return"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInitialScan()}
                            disabled={!!activeRecord || loading}
                        />
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
                    <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                        {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <span className="font-medium">{message}</span>
                    </div>
                )}
            </div>

            <Modal isOpen={!!activeRecord} onClose={fullReset}>
                <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
                    <h3 className="font-bold text-lg font-heading text-heading-text-black">Select Personal Leave Days</h3>
                    <button onClick={fullReset} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-center text-text-grey">{message}</p>

                    {/* Calendar Container */}
                    <div className="bg-primary-grey p-2 sm:p-4 rounded-lg border border-primary-dark-grey flex flex-col items-center">
                        <CustomDayPicker
                            mode="multiple"
                            min={1}
                            selected={manualHolidays}
                            onSelect={(days) => setManualHolidays(days || [])}
                            fromDate={activeRecord ? new Date(activeRecord.borrow_date) : new Date()}
                            toDate={new Date()}

                            // ✅ NEW: Disable Global Dates
                            disabled={globalDatesForDisplay}

                            // ✅ NEW: Style Global Dates distinctively
                            modifiers={{ globalHoliday: globalDatesForDisplay }}
                            modifiersClassNames={{
                                globalHoliday: 'bg-red-100 text-red-700 font-bold hover:bg-red-100 cursor-not-allowed decoration-red-700'
                            }}
                        />
                         {/* Legend for the user */}
                         <div className="flex gap-4 text-xs mt-3">
                             <div className="flex items-center gap-1">
                                 <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span> Global Holiday
                             </div>
                             <div className="flex items-center gap-1">
                                 <span className="w-3 h-3 rounded-full bg-button-yellow border border-yellow-500"></span> Personal Leave
                             </div>
                         </div>
                    </div>

                    <div className="text-center font-semibold text-text-grey">
                        You have selected {manualHolidays.length} personal leave day(s).
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={fullReset} className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition">Cancel</button>
                        <button onClick={() => handleFinalizeCheckIn(activeRecord, activeRecord.savedHolidays, manualHolidays)} disabled={loading} className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition">{loading ? 'Processing...' : `Confirm & Check In`}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isGlobalLeaveModalOpen} onClose={() => setIsGlobalLeaveModalOpen(false)}>
                <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
                    <h3 className="font-bold text-lg font-heading text-heading-text-black">Manage Global Leave Days</h3>
                    <button onClick={() => setIsGlobalLeaveModalOpen(false)} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-center text-text-grey">Select all official college holidays. These will be automatically excluded from all fine calculations.</p>
                    {globalHolidaysLoading ? <div className="text-center p-8">Loading...</div> : (
                        <div className="bg-primary-grey p-2 sm:p-4 rounded-lg border border-primary-dark-grey flex justify-center">
                            <CustomDayPicker mode="multiple" selected={globalHolidays} onSelect={(days) => setGlobalHolidays(days || [])} />
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={() => setIsGlobalLeaveModalOpen(false)} className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition">Cancel</button>
                        <button onClick={handleSaveGlobalHolidays} disabled={globalHolidaysLoading} className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition">{globalHolidaysLoading ? 'Saving...' : 'Save Global Leaves'}</button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

// --- Reusable Modal Component ---
function Modal({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: ReactNode }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-lg border border-primary-dark-grey">
                {children}
            </div>
        </div>
    )
}