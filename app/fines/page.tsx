'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '../loading'
import dayjs from 'dayjs'

// ✨ 1. Import PDF generation libraries
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function FinesPage() {
  const [loading, setLoading] = useState(true)
  const [fines, setFines] = useState<any[]>([])
  const [checkingSession, setCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('All')

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [currentFine, setCurrentFine] = useState<any | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const router = useRouter()

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
      setFines(data)
    }
    setLoading(false)
  }

  const openPaymentModal = (fineRecord: any) => {
    setCurrentFine(fineRecord)
    const remaining = (fineRecord.fine || 0) - (fineRecord.paid_amount || 0)
    setPaymentAmount(remaining.toString())
    setIsPaymentModalOpen(true)
  }

  const handleProcessPayment = async () => {
    if (!currentFine || !paymentAmount) return
    const amountToPay = parseInt(paymentAmount, 10)
    const remainingFine = (currentFine.fine || 0) - (currentFine.paid_amount || 0)

    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > remainingFine) {
      alert('Please enter a valid amount, up to the remaining fine.')
      return
    }

    const { error: logError } = await supabase
      .from('fine_payments')
      .insert({ borrow_record_id: currentFine.id, amount_paid: amountToPay })

    if (logError) {
      alert('❌ Failed to log payment.')
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
      alert('❌ Failed to update fine record.')
    } else {
      alert('✅ Payment successful!')
      fetchFines()
    }
    setIsPaymentModalOpen(false)
    setPaymentAmount('')
    setCurrentFine(null)
  }

  const handleWriteOff = async (fineRecord: any) => {
    const confirmed = window.confirm(`Are you sure you want to write off the remaining fine of ₹${(fineRecord.fine || 0) - (fineRecord.paid_amount || 0)} for "${fineRecord.member.name}"?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('borrow_records')
      .update({ fine_paid: true })
      .eq('id', fineRecord.id)

    if (error) {
      alert('❌ Failed to write off fine.')
    } else {
      alert('✅ Fine successfully written off.')
      fetchFines()
    }
  }

  const fetchPaymentHistory = async () => {
      setIsHistoryModalOpen(true)
      setHistoryLoading(true)
      const { data, error } = await supabase
          .from('fine_payments')
          .select('payment_date, amount_paid, borrow_records(book:book_id(title), member:member_id(name))')
          .order('payment_date', { ascending: false })

      if (data) setPaymentHistory(data)
      setHistoryLoading(false)
  }

  // ✨ 2. Add the PDF generation function
  const handlePrint = () => {
    const doc = new jsPDF()
    const tableColumns = ["Member", "Total Fine", "Paid", "Remaining"]
    const tableRows: any[] = []

    filteredFines.forEach(fine => {
      const remaining = (fine.fine || 0) - (fine.paid_amount || 0)
      const fineData = [
        fine.member.name,
        `Rs. ${fine.fine}`,
        `Rs. ${fine.paid_amount}`,
        `Rs. ${remaining}`,
      ]
      tableRows.push(fineData)
    })

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      didDrawPage: function (data) {
        // Header
        doc.setFontSize(20)
        doc.text(`Unpaid Fines Report: ${selectedBatch}`, data.settings.margin.left, 15)

        // Footer
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(10)
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)
        doc.text(`Generated on: ${dayjs().format('DD MMM YYYY')}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' })
      },
    })

    doc.save(`fines_report_${selectedBatch}_${dayjs().format('YYYY-MM-DD')}.pdf`)
  }

  const uniqueBatches = ['All', ...Array.from(new Set(fines.map(f => f.member?.batch).filter(Boolean)))].sort()
  const filteredFines = selectedBatch === 'All' ? fines : fines.filter(f => f.member?.batch === selectedBatch)
  const totalFineForBatch = filteredFines.reduce((sum, f) => sum + ((f.fine || 0) - (f.paid_amount || 0)), 0)

  if (checkingSession) return <Loading />
  if (!isLoggedIn) return null

  return (
    <>
      <div className="min-h-screen bg-primary-grey pt-24 px-4">
        <div className="max-w-7xl mx-auto backdrop-blur-md bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl uppercase md:text-4xl font-bold font-heading text-heading-text-black">Unpaid Fines</h1>
            <button onClick={fetchPaymentHistory} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold">
              View Payment History
            </button>
          </div>

          {loading ? <Loading /> : fines.length === 0 ? <p className="text-text-grey text-center">🎉 No unpaid fines</p> : (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 border-b border-primary-dark-grey pb-4">
                  {uniqueBatches.map((batch) => (
                    <button key={batch} onClick={() => setSelectedBatch(batch)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedBatch === batch ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                      {batch}
                    </button>
                  ))}
                </div>
                {/* ✨ 3. Add the Print button here */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-lg font-bold text-heading-text-black">
                    Total Remaining for {selectedBatch}: <span className="text-red-600">₹{totalFineForBatch}</span>
                  </div>
                  <button
                    onClick={handlePrint}
                    disabled={filteredFines.length === 0}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Print Report
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm text-left text-text-grey">
                  <thead className="bg-secondary-light-black backdrop-blur border-b border-primary-dark-grey">
                    <tr className='text-white uppercase'>
                      <th className="p-3 border">Member</th>
                      <th className="p-3 border">Book</th>
                      <th className="p-3 border">Total Fine</th>
                      <th className="p-3 border">Paid</th>
                      <th className="p-3 border">Remaining</th>
                      <th className="p-3 border text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFines.map((f) => {
                        const remaining = (f.fine || 0) - (f.paid_amount || 0)
                        return (
                          <tr key={f.id} className="border-t border-primary-dark-grey hover:bg-primary-dark-grey transition">
                            <td className="p-3 border">{f.member?.name}</td>
                            <td className="p-3 border font-malayalam">{f.book?.title}</td>
                            <td className="p-3 border">₹{f.fine}</td>
                            <td className="p-3 border text-green-600">₹{f.paid_amount}</td>
                            <td className="p-3 border font-bold text-red-600">₹{remaining}</td>
                            <td className="p-3 border text-center space-x-2">
                              <button onClick={() => openPaymentModal(f)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">
                                Record Payment
                              </button>
                              <button onClick={() => handleWriteOff(f)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition">
                                Write Off
                              </button>
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && currentFine && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Record Payment</h2>
            <p className="text-sm mb-1">For: <span className="font-semibold">{currentFine.member.name}</span></p>
            <p className="text-sm mb-4">Remaining Fine: <span className="font-bold text-red-600">₹{(currentFine.fine || 0) - (currentFine.paid_amount || 0)}</span></p>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              placeholder="Amount to pay"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPaymentModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleProcessPayment} className="bg-blue-600 text-white px-4 py-2 rounded">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Fine Payment History</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto">
              {historyLoading ? <Loading /> : (
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left bg-gray-100"><th className="p-2">Date</th><th className="p-2">Member</th><th className="p-2">Book</th><th className="p-2">Amount</th></tr></thead>
                  <tbody>
                    {paymentHistory.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="p-2">{dayjs(p.payment_date).format('DD MMM YYYY, h:mm A')}</td>
                        <td className="p-2">{p.borrow_records.member.name}</td>
                        <td className="p-2 font-malayalam">{p.borrow_records.book.title}</td>
                        <td className="p-2 font-semibold">₹{p.amount_paid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
