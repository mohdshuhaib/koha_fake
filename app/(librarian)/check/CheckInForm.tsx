'use client'

import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs' // Import the new custom component
import 'react-day-picker/dist/style.css'
import { Barcode, X, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react'
import clsx from 'classnames'
import { CustomDayPicker } from '@/components/CustomDayPicker'

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
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleInitialScan = async () => {
        if (!barcode) return
        setLoading(true)
        setMessage('')
        setIsError(false)

        const { data: book } = await supabase.from('books').select('id, title').eq('barcode', barcode).single()
        if (!book) {
            setNotification({ type: 'error', message: 'Book not found with that barcode.'})
            setLoading(false)
            return
        }

        const { data: record } = await supabase.from('borrow_records').select('*, member:member_id(*)').eq('book_id', book.id).is('return_date', null).single()
        if (!record) {
            setNotification({ type: 'error', message: 'This book is not currently checked out.'})
            setLoading(false)
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
            setNotification({ type: 'error', message: 'The check-in process failed. Please try again.'})
        } else {
            let successMessage = `Returned "${recordToProcess.book.title}" by ${recordToProcess.member.name}.`
            if (fine > 0) successMessage += ` Fine: ₹${fine}.`
            if (totalHolidayCount > 0) successMessage += ` (${totalHolidayCount} total leave day(s) excluded.)`
            setNotification({ type: 'success', message: successMessage })
        }
        resetProcess()
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
            setNotification({ type: 'error', message: 'Failed to save global holidays. Please ensure no duplicate dates are selected.'})
            console.error(error);
        } else {
            setNotification({ type: 'success', message: 'Global leave days have been updated successfully.'})
            setIsGlobalLeaveModalOpen(false);
        }
        setGlobalHolidaysLoading(false);
    }

    const resetProcess = () => {
        setActiveRecord(null)
        setManualHolidays([])
        setBarcode('')
        setLoading(false)
        setMessage('')
        setIsError(false)
    }

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

            <Modal isOpen={!!activeRecord} onClose={resetProcess}>
                <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
                    <h3 className="font-bold text-lg font-heading text-heading-text-black">Select Personal Leave Days</h3>
                    <button onClick={resetProcess} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-center text-text-grey">{message}</p>
                    <div className="bg-primary-grey p-2 sm:p-4 rounded-lg border border-primary-dark-grey">
                        <CustomDayPicker mode="multiple" min={1} selected={manualHolidays} onSelect={(days) => setManualHolidays(days || [])} fromDate={activeRecord ? new Date(activeRecord.borrow_date) : new Date()} toDate={new Date()} />
                    </div>
                    <div className="text-center font-semibold text-text-grey">You have selected {manualHolidays.length} personal leave day(s).</div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={resetProcess} className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition">Cancel</button>
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
                        <div className="bg-primary-grey p-2 sm:p-4 rounded-lg border border-primary-dark-grey">
                            <CustomDayPicker mode="multiple" selected={globalHolidays} onSelect={(days) => setGlobalHolidays(days || [])} />
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={() => setIsGlobalLeaveModalOpen(false)} className="bg-gray-200 text-text-grey px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark-grey transition">Cancel</button>
                        <button onClick={handleSaveGlobalHolidays} disabled={globalHolidaysLoading} className="bg-dark-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-icon-green transition">{globalHolidaysLoading ? 'Saving...' : 'Save Global Leaves'}</button>
                    </div>
                </div>
            </Modal>

            <NotificationModal
                notification={notification}
                onClose={() => setNotification(null)}
            />
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

function NotificationModal({ notification, onClose }: { notification: { type: 'success' | 'error', message: string } | null, onClose: () => void }) {
    if (!notification) return null;
    const isError = notification.type === 'error';
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-secondary-white rounded-xl shadow-2xl w-full max-w-sm border border-primary-dark-grey p-6 text-center">
                {isError ? (
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                ) : (
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                )}
                <h3 className={clsx("mt-4 text-xl font-bold font-heading", isError ? "text-red-700" : "text-dark-green")}>
                    {isError ? 'Error' : 'Success'}
                </h3>
                <p className="mt-2 text-sm text-text-grey">{notification.message}</p>
                <button onClick={onClose} className="mt-6 w-full bg-button-yellow text-button-text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition">
                    OK
                </button>
            </div>
        </div>
    )
}
