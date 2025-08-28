'use client'

import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Award,
  Book,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import clsx from 'classnames'

// --- Type Definitions ---
type Record = {
  id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  members: { name: string } | null
  books: { title: string } | null
}

type Ranked = {
  name: string
  count: number
}

// --- Main Page Component ---
export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [topMembers, setTopMembers] = useState<Ranked[]>([])
  const [topBooks, setTopBooks] = useState<Ranked[]>([])
  const [topBatches, setTopBatches] = useState<Ranked[]>([])
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [recordToDelete, setRecordToDelete] = useState<Record | null>(null)
  const pageSize = 10

  // --- Data Fetching and Ranking Logic ---
  useEffect(() => {
    fetchData()
    fetchTopMembers()
    fetchTopBooks()
    fetchTopBatches()
  }, [])

  useEffect(() => { setPage(1) }, [searchQuery])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select(`
        id,
        borrow_date,
        due_date,
        return_date,
        members ( name ),
        books ( title )
      `)
      .order('borrow_date', { ascending: false })

    if (!error && data) {
      const normalized = data.map((r: any) => ({
        ...r,
        members: Array.isArray(r.members) ? r.members[0] : r.members,
        books: Array.isArray(r.books) ? r.books[0] : r.books,
      }))
      setRecords(normalized)
    }
  }

  // ✨ UPDATED: Fetch top 10 members
  const fetchTopMembers = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('member_id, members(name, category)')

    if (!error && data) {
      const counts: { [memberId: string]: Ranked } = {}
      data.forEach((d: any) => {
        const member = Array.isArray(d.members) ? d.members[0] : d.members
        if (!member?.name || member?.category !== 'student') return
        if (!counts[d.member_id]) {
          counts[d.member_id] = { name: member.name, count: 1 }
        } else {
          counts[d.member_id].count++
        }
      })
      const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10)
      setTopMembers(sorted)
    }
  }

  // ✨ UPDATED: Fetch top 10 books
  const fetchTopBooks = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('book_id, books(title)')

    if (!error && data) {
      const counts: { [bookId: string]: Ranked } = {}
      data.forEach((d: any) => {
        const book = Array.isArray(d.books) ? d.books[0] : d.books
        if (!book?.title) return
        if (!counts[d.book_id]) {
          counts[d.book_id] = { name: book.title, count: 1 }
        } else {
          counts[d.book_id].count++
        }
      })
      const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10)
      setTopBooks(sorted)
    }
  }

  // ✨ UPDATED: Fetch top 10 batches
  const fetchTopBatches = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('id, member_id, members(batch, category)')

    if (!error && data) {
      const counts: { [batch: string]: number } = {}
      data.forEach((record: any) => {
        const member = Array.isArray(record.members) ? record.members[0] : record.members
        if (!member?.batch || member?.category === 'class') return
        counts[member.batch] = (counts[member.batch] || 0) + 1
      })
      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      setTopBatches(sorted)
    }
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('borrow_records').delete().eq('id', id)
    if (error) {
      alert('Failed to delete the record.')
      console.error(error)
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    }
    setRecordToDelete(null)
  }

  const getStatus = (r: Record) => {
    if (r.return_date) return 'Returned'
    if (dayjs().isAfter(dayjs(r.due_date), 'day')) return 'Overdue'
    return 'Borrowed'
  }

  const filteredRecords = records.filter((record) =>
    (record.members?.name || 'Unknown').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.books?.title || 'Unknown').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize)

  return (
    <>
      <div className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading-text-black uppercase tracking-wider">
              Library Stats & History
            </h1>
            <p className="text-text-grey mt-1">An overview of library activity and leaderboards.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LeaderboardCard title="Top Readers" icon={<Award className="text-yellow-500" />} data={topMembers} unit="books" />
            <LeaderboardCard title="Top Books" icon={<Book className="text-blue-500" />} data={topBooks} unit="checkouts" />
            <LeaderboardCard title="Top Batches" icon={<Users className="text-purple-500" />} data={topBatches} unit="checkouts" />
          </div>

          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="relative mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-text-grey" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by member or book name..."
                className="w-full md:w-1/2 p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary-light-black text-white">
                  <tr>
                    <th className="text-left p-3 font-semibold uppercase tracking-wider">Member</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wider">Book</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wider">Borrowed</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wider">Due</th>
                    <th className="text-left p-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-center p-3 font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice((page - 1) * pageSize, page * pageSize).map((r) => (
                    <tr key={r.id} className="border-b border-primary-dark-grey last:border-b-0 hover:bg-primary-grey transition">
                      <td className="p-3 text-heading-text-black font-semibold">{r.members?.name || 'N/A'}</td>
                      <td className="p-3 text-text-grey">{r.books?.title || 'N/A'}</td>
                      <td className="p-3 text-text-grey">{dayjs(r.borrow_date).format('DD MMM YYYY')}</td>
                      <td className="p-3 text-text-grey">{dayjs(r.due_date).format('DD MMM YYYY')}</td>
                      <td className="p-3"><StatusBadge status={getStatus(r)} /></td>
                      <td className="p-3 text-center">
                        <button onClick={() => setRecordToDelete(r)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition" title="Delete record">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
               <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 transition">
                 <ChevronLeft size={20} />
               </button>
               <span className="text-text-grey font-semibold">Page {page} of {totalPages}</span>
               <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 transition">
                 <ChevronRight size={20} />
               </button>
             </div>
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={() => handleDelete(recordToDelete!.id)}
        record={recordToDelete}
      />
    </>
  )
}

// --- Helper Components ---

// ✨ UPDATED: LeaderboardCard now manages its own expanded state
function LeaderboardCard({ title, icon, data, unit }: { title: string; icon: ReactNode; data: Ranked[]; unit: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];
  const itemsToShow = isExpanded ? data : data.slice(0, 3);

  return (
    <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6 shadow-lg flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary-grey p-2 rounded-full">{icon}</div>
        <h2 className="text-lg font-bold text-heading-text-black uppercase tracking-wider">{title}</h2>
      </div>
      <ul className="space-y-2 text-text-grey flex-grow">
        {itemsToShow.map((item, i) => (
          <li key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-primary-grey">
            <span className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{medals[i] || `${i + 1}.`}</span>
              <span className="font-semibold text-heading-text-black">{item.name}</span>
            </span>
            <span className="font-bold text-sm">{item.count} <span className="font-normal">{unit}</span></span>
          </li>
        ))}
        {data.length === 0 && <li className="text-center text-sm p-4">Not enough data yet.</li>}
      </ul>
      {data.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show More <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Returned: 'bg-green-100 text-green-800',
    Overdue: 'bg-yellow-100 text-yellow-800',
    Borrowed: 'bg-blue-100 text-blue-800',
  }
  return <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold", styles[status as keyof typeof styles])}>{status}</span>
}

function DeleteModal({ isOpen, onClose, onConfirm, record }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; record: Record | null }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-md w-full border border-primary-dark-grey">
        <div className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-xl font-bold font-heading text-heading-text-black">Delete Record?</h3>
          <p className="mt-2 text-sm text-text-grey">
            Are you sure you want to permanently delete the record for <strong className="text-heading-text-black">{record?.books?.title}</strong> borrowed by <strong className="text-heading-text-black">{record?.members?.name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-text-grey bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  )
}
