'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import dayjs from 'dayjs'
import { BookOpen, IndianRupee, LogOut, Book, Clock, Check, AlertTriangle } from 'lucide-react'
import clsx from 'classnames'

// --- Type Definitions ---
type Record = {
  return_date: string | null
  fine: number
  fine_paid: boolean
  borrow_date: string
  due_date: string
  books: {
    title: string
  } | null
}

type MemberData = {
  name: string
  booksRead: number
  pendingFines: number
  currentlyBorrowed: Record[]
  returnedHistory: Record[]
}

// --- Main Page Component ---
export default function MemberDashboard() {
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/member-login')
        return
      }

      const barcode = user.email?.split('@')[0] || ''
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name')
        .eq('barcode', barcode.toUpperCase())
        .single()

      if (memberError || !memberData) {
        setError('Could not find your member profile.')
        setLoading(false)
        return
      }

      const { data: records } = await supabase
        .from('borrow_records')
        .select('*, books(title)')
        .eq('member_id', memberData.id)
        .order('borrow_date', { ascending: false })

      const returnedHistory = records?.filter((r) => r.return_date !== null) || []
      const currentlyBorrowed = records?.filter((r) => r.return_date === null) || []
      const pendingFines = currentlyBorrowed.reduce((acc, r) => acc + (r.fine_paid ? 0 : r.fine || 0), 0)

      setMember({
        name: memberData.name,
        booksRead: returnedHistory.length,
        pendingFines,
        currentlyBorrowed,
        returnedHistory,
      })
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <Loading />
  if (error) return <div className="p-8 pt-24 text-center text-red-500">{error}</div>
  if (!member) return null

  // --- REDESIGNED JSX ---
  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading-text-black">
              Welcome, {member.name}
            </h1>
            <p className="text-text-grey mt-1">Here's an overview of your library activity.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-red-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard label="Total Books Read" value={member.booksRead} icon={<BookOpen className="text-blue-500" />} />
          <StatCard label="Pending Fines" value={`₹${member.pendingFines}`} icon={<IndianRupee className="text-red-500" />} />
        </div>

        <div className="bg-secondary-white rounded-xl p-6 shadow-lg border border-primary-dark-grey">
          <h2 className="text-2xl font-bold mb-4 text-heading-text-black font-heading">Borrowing Status</h2>
          <div className="space-y-6">
            <HistoryList title="Currently Borrowed" records={member.currentlyBorrowed} isBorrowedList={true} />
            <HistoryList title="Returned History" records={member.returnedHistory} isBorrowedList={false} />
          </div>
        </div>
      </div>
    </div>
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

function HistoryList({ title, records, isBorrowedList }: { title: string; records: Record[]; isBorrowedList: boolean }) {
  return (
    <div>
      <h3 className={clsx("text-lg font-bold mb-3", isBorrowedList ? 'text-blue-700' : 'text-green-700')}>{title}</h3>
      <div className="space-y-3 text-sm max-h-80 overflow-y-auto pr-2">
        {records.length === 0 ? (
          <p className="text-text-grey text-sm p-4 bg-primary-grey rounded-md">
            {isBorrowedList ? "You have no books currently checked out." : "You haven't returned any books yet."}
          </p>
        ) : (
          records.map((record, index) => {
            const isOverdue = dayjs().isAfter(dayjs(record.due_date), 'day');
            return (
              <div key={index} className="border-b border-primary-dark-grey pb-3 last:border-b-0">
                <p className="font-semibold text-heading-text-black flex items-center gap-2">
                  <Book size={14} />
                  {record.books?.title || 'Unknown Book'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-grey mt-1 pl-6">
                  {isBorrowedList ? (
                    <>
                      <span><Clock size={12} className="inline mr-1" /><strong>Due:</strong> {dayjs(record.due_date).format('DD MMM YYYY')}</span>
                      {isOverdue && <span className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={12}/>Overdue</span>}
                    </>
                  ) : (
                    <span><Check size={12} className="inline mr-1" /><strong>Returned:</strong> {dayjs(record.return_date).format('DD MMM YYYY')}</span>
                  )}
                  {record.fine > 0 && (
                    <span className={record.fine_paid ? 'text-green-600' : 'text-red-600'}>
                      <strong>Fine:</strong> ₹{record.fine} {record.fine_paid ? '(Paid)' : '(Unpaid)'}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}