'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' // Corrected import path
import Loading from '../loading' // Corrected import path
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  IndianRupee, Users, History, Printer, CreditCard, Eraser, X, AlertTriangle
} from 'lucide-react'
import clsx from 'classnames'

// --- Type Definitions ---
type FineRecord = {
  id: number
  fine: number
  paid_amount: number
  member: { name: string; batch: string }
  book: { title: string }
}

// --- Main Page Component ---
export default function FinesPage() {
  const [loading, setLoading] = useState(true)
  const [fines, setFines] = useState<FineRecord[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState('All')

  const [modalState, setModalState] = useState<{ type: 'payment' | 'history' | 'writeOff' | null; data: any }>({ type: null, data: null })

  const [paymentAmount, setPaymentAmount] = useState('')
  const [writeOffReason, setWriteOffReason] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const router = useRouter()

  // --- Data Fetching and Logic ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setCheckingSession(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (isLoggedIn) {
      fetchFines()
    }
  }, [isLoggedIn])

  const fetchFines = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('borrow_records')
      .select('id, fine, paid_amount, return_date, fine_paid, member:member_id(name, batch), book:book_id(title)')
      .eq('fine_paid', false)
      .gt('fine', 0)

    if (error) {
      console.error(error)
    } else {
      setFines(data as any)
    }
    setLoading(false)
  }

  const handleProcessPayment = async () => {
    const currentFine = modalState.data;
    if (!currentFine || !paymentAmount) return

    const amountToPay = parseInt(paymentAmount, 10)
    const remainingFine = (currentFine.fine || 0) - (currentFine.paid_amount || 0)

    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > remainingFine) {
      alert('Please enter a valid amount, up to the remaining fine.')
      return
    }

    const { error: logError } = await supabase
      .from('fine_payments')
      .insert({ borrow_record_id: currentFine.id, amount_paid: amountToPay, notes: 'Standard Payment' })

    if (logError) {
      console.error(logError);
      alert('Failed to log payment.')
      return
    }

    const newPaidAmount = (currentFine.paid_amount || 0) + amountToPay
    const isFullyPaid = newPaidAmount >= currentFine.fine

    const { error: updateError } = await supabase
      .from('borrow_records')
      .update({
        paid_amount: newPaidAmount,
        fine_paid: isFullyPaid,
      })
      .eq('id', currentFine.id)

    if (updateError) {
      alert('Failed to update fine record.')
    } else {
      fetchFines()
    }
    setModalState({ type: null, data: null })
  }

  const handleWriteOff = async () => {
    const fineRecord = modalState.data;
    if (!fineRecord || !writeOffReason.trim()) {
        alert('Please provide a reason for writing off the fine.');
        return;
    }

    const { error: logError } = await supabase
        .from('fine_payments')
        .insert({
            borrow_record_id: fineRecord.id,
            amount_paid: 0,
            notes: `Write-Off: ${writeOffReason}`
        });

    if (logError) {
        alert('Failed to log the write-off event.');
        console.error(logError);
        return;
    }

    const { error: updateError } = await supabase
      .from('borrow_records')
      .update({ fine_paid: true })
      .eq('id', fineRecord.id)

    if (updateError) {
      alert('Failed to write off fine.')
    } else {
      fetchFines()
    }
    setModalState({ type: null, data: null })
    setWriteOffReason('');
  }

  const fetchPaymentHistory = async () => {
    setModalState({ type: 'history', data: null })
    setHistoryLoading(true)
    const { data, error } = await supabase
      .from('fine_payments')
      .select('id, payment_date, amount_paid, notes, borrow_records(book:book_id(title), member:member_id(name))')
      .order('payment_date', { ascending: false })

    if (data) setPaymentHistory(data)
    setHistoryLoading(false)
  }

  // ✨ UPDATED: Implemented the PDF printing logic
  const handlePrint = () => {
    const doc = new jsPDF()
    const tableColumns = ["Member", "Total Fine", "Paid", "Remaining"]
    const tableRows: (string | number)[][] = []

    filteredFines.forEach(fine => {
        const remaining = (fine.fine || 0) - (fine.paid_amount || 0)
        const fineData = [
            fine.member?.name || 'N/A',
            `Rs. ${fine.fine}`,
            `Rs. ${fine.paid_amount || 0}`,
            `Rs. ${remaining}`,
        ];
        tableRows.push(fineData);
    });

    const totalOwed = filteredFines.reduce((sum, f) => sum + (f.fine - (f.paid_amount || 0)), 0);

    // Add title and date
    doc.setFontSize(18);
    doc.text(`Fine Report - ${selectedBatch} Batch`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dayjs().format('DD MMM YYYY')}`, 14, 29);

    // Add table using autoTable
    autoTable(doc, {
        startY: 35,
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [34, 34, 34] }
    });

    // Add summary footer
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Remaining Fine: Rs. ${totalOwed.toLocaleString('en-IN')}`, 14, finalY + 10);

    doc.save(`fine_report_${selectedBatch}_${dayjs().format('YYYY-MM-DD')}.pdf`)
  }

  const openPaymentModal = (fineRecord: FineRecord) => {
    const remaining = (fineRecord.fine || 0) - (fineRecord.paid_amount || 0)
    setPaymentAmount(remaining.toString())
    setModalState({ type: 'payment', data: fineRecord })
  }

  const openWriteOffModal = (fineRecord: FineRecord) => {
    setWriteOffReason('');
    setModalState({ type: 'writeOff', data: fineRecord })
  }

  const uniqueBatches = ['All', ...Array.from(new Set(fines.map(f => f.member?.batch).filter(Boolean)))].sort()
  const filteredFines = selectedBatch === 'All' ? fines : fines.filter(f => f.member?.batch === selectedBatch)
  const totalOwed = filteredFines.reduce((sum, f) => sum + (f.fine - (f.paid_amount || 0)), 0)
  const patronsWithFines = new Set(filteredFines.map(f => f.member.name)).size

  if (checkingSession || (loading && fines.length === 0)) return <Loading />
  if (!isLoggedIn) return null

  return (
    <>
      <div className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading-text-black uppercase tracking-wider">Fine Management</h1>
                    <p className="text-text-grey mt-1">Track and manage all outstanding library fines.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchPaymentHistory} className="flex items-center gap-2 px-4 py-2 bg-secondary-white border border-primary-dark-grey text-text-grey rounded-lg font-semibold text-sm hover:bg-primary-dark-grey transition">
                        <History size={16} /> Payment History
                    </button>
                </div>
            </div>

            {/* --- Stat Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard label="Total Fines Owed" value={`₹${totalOwed.toLocaleString('en-IN')}`} icon={<IndianRupee className="text-red-500" />} />
                <StatCard label="Patrons with Fines" value={patronsWithFines} icon={<Users className="text-orange-500" />} />
            </div>

            {/* --- Main Table and Filters --- */}
            <div className="bg-secondary-white border border-primary-dark-grey rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-primary-dark-grey pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-text-grey mr-2">Filter by Batch:</span>
                        {uniqueBatches.map((batch) => (
                            <button key={batch} onClick={() => setSelectedBatch(batch)} className={clsx('px-3 py-1.5 rounded-full text-xs font-bold transition', selectedBatch === batch ? 'bg-dark-green text-white shadow' : 'bg-primary-dark-grey text-heading-text-black hover:bg-icon-green hover:text-white')}>
                                {batch}
                            </button>
                        ))}
                    </div>
                    <button onClick={handlePrint} disabled={filteredFines.length === 0} className="flex items-center gap-2 px-4 py-2 bg-secondary-light-black text-white rounded-lg font-semibold text-sm hover:bg-heading-text-black transition disabled:opacity-50 w-full md:w-auto">
                        <Printer size={16} /> Print Report
                    </button>
                </div>

                {loading ? <Loading /> : filteredFines.length === 0 ? (
                    <div className="text-center py-10"><h3 className="text-lg font-medium text-heading-text-black">All Clear!</h3><p className="mt-1 text-sm text-text-grey">No unpaid fines found for this batch.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-secondary-light-black text-white">
                                <tr>
                                    <th className="p-3 text-left font-semibold uppercase tracking-wider">Member</th>
                                    <th className="p-3 text-left font-semibold uppercase tracking-wider">Book</th>
                                    <th className="p-3 text-center font-semibold uppercase tracking-wider">Total</th>
                                    <th className="p-3 text-center font-semibold uppercase tracking-wider">Paid</th>
                                    <th className="p-3 text-center font-semibold uppercase tracking-wider">Remaining</th>
                                    <th className="p-3 text-center font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFines.map((f) => {
                                    const remaining = (f.fine || 0) - (f.paid_amount || 0)
                                    return (
                                        <tr key={f.id} className="border-b border-primary-dark-grey last:border-b-0 hover:bg-primary-grey transition">
                                            <td className="p-3"><p className="font-semibold text-heading-text-black">{f.member?.name}</p><p className="text-xs text-text-grey">{f.member?.batch}</p></td>
                                            <td className="p-3 text-text-grey font-malayalam">{f.book?.title}</td>
                                            <td className="p-3 text-center text-text-grey">₹{f.fine}</td>
                                            <td className="p-3 text-center text-green-600 font-semibold">₹{f.paid_amount || 0}</td>
                                            <td className="p-3 text-center text-red-600 font-bold">₹{remaining}</td>
                                            <td className="p-3 text-center space-y-2 md:space-y-0 md:space-x-2">
                                                <button onClick={() => openPaymentModal(f)} className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">
                                                    <CreditCard size={14} /> Record Payment
                                                </button>
                                                <button onClick={() => openWriteOffModal(f)} className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-yellow-500 text-button-text-black font-semibold hover:bg-yellow-600 transition">
                                                    <Eraser size={14} /> Write Off
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </div>

      <Modal isOpen={!!modalState.type} onClose={() => setModalState({ type: null, data: null })}>
        {modalState.type === 'payment' && (
            <PaymentContent fine={modalState.data} amount={paymentAmount} setAmount={setPaymentAmount} onConfirm={handleProcessPayment} onClose={() => setModalState({ type: null, data: null })} />
        )}
        {modalState.type === 'history' && (
            <HistoryContent history={paymentHistory} loading={historyLoading} onClose={() => setModalState({ type: null, data: null })} />
        )}
        {modalState.type === 'writeOff' && (
            <WriteOffContent fine={modalState.data} reason={writeOffReason} setReason={setWriteOffReason} onConfirm={handleWriteOff} onClose={() => setModalState({ type: null, data: null })} />
        )}
      </Modal>
    </>
  )
}

// --- Helper Components ---
function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div className="bg-secondary-white rounded-xl p-5 shadow-lg flex items-center gap-4 border border-primary-dark-grey">
      <div className="bg-primary-grey p-3 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-text-grey font-semibold">{label}</p>
        <p className="text-2xl font-bold text-heading-text-black">{value}</p>
      </div>
    </div>
  )
}

function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-2xl w-full border border-primary-dark-grey" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// --- Modal Content Components ---
function PaymentContent({ fine, amount, setAmount, onConfirm, onClose }: any) {
    const remaining = (fine.fine || 0) - (fine.paid_amount || 0);
    return <>
        <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center"><h2 className="text-lg font-bold font-heading">Record Payment</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-primary-dark-grey"><X size={20}/></button></div>
        <div className="p-6 space-y-4">
            <p>For: <strong className="text-heading-text-black">{fine.member.name}</strong> on book "{fine.book.title}"</p>
            <p>Remaining Fine: <strong className="font-bold text-red-600 text-lg">₹{remaining}</strong></p>
            <div>
                <label className="text-sm font-semibold text-text-grey">Amount to Pay</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mt-1 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green" placeholder="Enter amount"/>
            </div>
        </div>
        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl"><button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button><button onClick={onConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-dark-green rounded-lg hover:bg-icon-green">Confirm Payment</button></div>
    </>
}

function HistoryContent({ history, loading, onClose }: any) {
    return <>
        <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center"><h2 className="text-lg font-bold font-heading">Fine Payment History</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-primary-dark-grey"><X size={20}/></button></div>
        <div className="p-1 max-h-[60vh] overflow-y-auto">
            {loading ? <Loading/> :
            <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-primary-dark-grey"><tr className="text-left"><th className="p-2">Date</th><th className="p-2">Member</th><th className="p-2">Book</th><th className="p-2">Details</th></tr></thead>
                <tbody>{history.map((p:any) => (
                    <tr key={p.id} className="border-b border-primary-dark-grey">
                        <td className="p-2 align-top">{dayjs(p.payment_date).format('DD MMM, h:mm A')}</td>
                        <td className="p-2 align-top">{p.borrow_records.member.name}</td>
                        <td className="p-2 align-top">{p.borrow_records.book.title}</td>
                        {p.amount_paid > 0 ? (
                            <td className="p-2 align-top font-semibold text-green-700">Paid ₹{p.amount_paid}</td>
                        ) : (
                            <td className="p-2 align-top text-yellow-700">
                                <span className="font-semibold block">Written Off</span>
                                <span className="text-xs italic">"{p.notes}"</span>
                            </td>
                        )}
                    </tr>))}
                </tbody>
            </table>
            }
        </div>
    </>
}

function WriteOffContent({ fine, reason, setReason, onConfirm, onClose }: any) {
    return <>
        <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-4 text-xl font-bold font-heading">Write Off Fine?</h3>
            <p className="mt-2 text-sm text-text-grey">
                This will forgive the remaining fine of <strong className="text-red-600">₹{(fine.fine || 0) - (fine.paid_amount || 0)}</strong> for <strong className="text-heading-text-black">{fine.member.name}</strong>. Please provide a reason below.
            </p>
            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Book was found damaged, special permission granted..."
                className="w-full mt-4 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green text-sm"
                rows={3}
            />
        </div>
        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
            <button onClick={onConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled={!reason.trim()}>
                Confirm Write-Off
            </button>
        </div>
    </>
}
