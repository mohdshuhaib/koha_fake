'use client'

import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import Loading from '@/app/loading'
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
  BookOpen,
  IndianRupee,
  X,
  Calendar,
  Clock,
  Check,
  Info
} from 'lucide-react'
import clsx from 'classnames'

// --- Type Definitions ---
type Record = {
  id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  member_id: string // Added for linking
  members: { name: string } | null
  books: { title: string , barcode: string} | null
}

type RankedMember = {
  name: string
  count: number // Books read count
  totalPagesRead: number // Total pages count
}

type RankedItem = {
  name: string
  count: number
}

type MemberDetails = {
    name: string
    booksRead: number
    pendingFines: number
    returned: any[]
    notReturned: any[]
}

// --- Main Page Component ---
export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [topMembers, setTopMembers] = useState<RankedMember[]>([])
  const [topBooks, setTopBooks] = useState<RankedItem[]>([])
  const [topBatches, setTopBatches] = useState<RankedItem[]>([])
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [recordToDelete, setRecordToDelete] = useState<Record | null>(null)
  const pageSize = 10

  // Modal States
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

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
        member_id,
        members ( name ),
        books ( title , barcode)
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

  // --- 1. Updated Top Readers Logic (Aggregates both Books and Pages) ---
  const fetchTopMembers = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('member_id, members(name, category), books(pages)')
      .not('return_date', 'is', null) // Only count returned books

    if (!error && data) {
      const counts: { [memberId: string]: RankedMember } = {}

      data.forEach((d: any) => {
        const member = Array.isArray(d.members) ? d.members[0] : d.members;
        const book = Array.isArray(d.books) ? d.books[0] : d.books;

        if (!member?.name || member?.category !== 'student') return;

        if (!counts[d.member_id]) {
          counts[d.member_id] = { name: member.name, count: 0, totalPagesRead: 0 };
        }

        counts[d.member_id].count++;
        counts[d.member_id].totalPagesRead += (book?.pages || 0);
      })

      // We don't sort here anymore, we just pass the raw data to the component
      setTopMembers(Object.values(counts))
    }
  }

  const fetchTopBooks = async () => {
    const { data, error } = await supabase.from('borrow_records').select('book_id, books(title)')
    if (!error && data) {
      const counts: { [bookId: string]: RankedItem } = {}
      data.forEach((d: any) => {
        const book = Array.isArray(d.books) ? d.books[0] : d.books
        if (!book?.title) return
        counts[d.book_id] = counts[d.book_id] || { name: book.title, count: 0 }
        counts[d.book_id].count++
      })
      setTopBooks(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10))
    }
  }

  const fetchTopBatches = async () => {
    const { data, error } = await supabase.from('borrow_records').select('id, member_id, members(batch, category)')
    if (!error && data) {
      const counts: { [batch: string]: number } = {}
      data.forEach((record: any) => {
        const member = Array.isArray(record.members) ? record.members[0] : record.members
        if (!member?.batch || member?.category === 'class') return
        counts[member.batch] = (counts[member.batch] || 0) + 1
      })
      setTopBatches(Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10))
    }
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('borrow_records').delete().eq('id', id)
    if (error) { alert('Failed to delete.'); console.error(error); }
    else { setRecords((prev) => prev.filter((r) => r.id !== id)) }
    setRecordToDelete(null)
  }

  // --- 2. Member Detail View Logic ---
  const handleMemberClick = async (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setDetailsLoading(true);
    setMemberDetails(null);

    // Fetch detailed history including extra book info for tooltips
    const { data: records } = await supabase
      .from('borrow_records')
      .select('*, books(title, barcode, author, pages, shelf_location)')
      .eq('member_id', memberId)
      .order('borrow_date', { ascending: false })

    const returned: any[] = [];
    const notReturned: any[] = [];
    records?.forEach(record => {
        if (record.return_date) returned.push(record);
        else notReturned.push(record);
    });
    const pendingFines = records?.reduce((acc, r) => acc + (r.fine_paid ? 0 : r.fine || 0), 0) || 0

    setMemberDetails({
        name: memberName,
        booksRead: returned.length,
        pendingFines,
        returned,
        notReturned
    });
    setDetailsLoading(false);
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

          {/* --- Top Stats Grid --- */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ✨ Updated Top Readers Card with Toggle */}
            <TopReadersCard data={topMembers} />
            <LeaderboardCard title="Top Books" icon={<Book className="text-blue-500" />} data={topBooks} unit="checkouts" />
            <LeaderboardCard title="Top Batches" icon={<Users className="text-purple-500" />} data={topBatches} unit="checkouts" />
          </div>

          {/* --- History Table --- */}
          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="relative mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Search className="h-5 w-5 text-text-grey" /></div>
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
                      <td className="p-3">
                        {/* ✨ Clickable Member Name */}
                        <button
                            onClick={() => r.members && handleMemberClick(r.member_id, r.members.name)}
                            className="text-heading-text-black font-semibold hover:text-blue-600 hover:underline text-left"
                        >
                            {r.members?.name || 'N/A'}
                        </button>
                      </td>
                      <td className="p-3 text-text-grey">{r.books?.title || 'N/A'}</td>
                      <td className="p-3 text-text-grey">{dayjs(r.borrow_date).format('DD MMM YYYY')}</td>
                      <td className="p-3 text-text-grey">{dayjs(r.due_date).format('DD MMM YYYY')}</td>
                      <td className="p-3"><StatusBadge status={(r.return_date ? 'Returned' : (dayjs().isAfter(dayjs(r.due_date), 'day') ? 'Overdue' : 'Borrowed'))} /></td>
                      <td className="p-3 text-center">
                        <button onClick={() => setRecordToDelete(r)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition" title="Delete record"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
               <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 transition"><ChevronLeft size={20} /></button>
               <span className="text-text-grey font-semibold">Page {page} of {totalPages}</span>
               <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 transition"><ChevronRight size={20} /></button>
             </div>
          </div>
        </div>
      </div>

      <DeleteModal isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)} onConfirm={() => handleDelete(recordToDelete!.id)} record={recordToDelete} />

      {/* ✨ Member Details Modal */}
      <DetailsModal isOpen={!!selectedMemberId} onClose={() => setSelectedMemberId(null)}>
        {detailsLoading ? <Loading /> : memberDetails ? (
          <>
            <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
                <h2 className="text-xl font-bold text-heading-text-black">{memberDetails.name}'s History</h2>
                <button onClick={() => setSelectedMemberId(null)} className="p-1 rounded-full hover:bg-primary-dark-grey"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Books Read" value={memberDetails.booksRead} icon={<BookOpen className="text-blue-500" />} />
                <StatCard label="Pending Fines" value={`₹${memberDetails.pendingFines}`} icon={<IndianRupee className="text-red-500" />} />
              </div>
              <div className="space-y-4">
                <HistoryList title="Not Returned" records={memberDetails.notReturned} isReturnedList={false} />
                <HistoryList title="Returned History" records={memberDetails.returned} isReturnedList={true} />
              </div>
            </div>
          </>
        ) : <p className="p-8 text-center text-red-500">Could not load details.</p>}
      </DetailsModal>
    </>
  )
}

// --- Helper Components ---

// ✨ Special Card for Top Readers with Toggle Logic
function TopReadersCard({ data }: { data: RankedMember[] }) {
  const [mode, setMode] = useState<'books' | 'pages'>('books');
  const [isExpanded, setIsExpanded] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];

  // Sort data based on selected mode
  const sortedData = [...data].sort((a, b) =>
    mode === 'books' ? b.count - a.count : b.totalPagesRead - a.totalPagesRead
  );

  const itemsToShow = isExpanded ? sortedData.slice(0, 10) : sortedData.slice(0, 3);

  return (
    <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6 shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <div className="bg-primary-grey p-2 rounded-full"><Award className="text-yellow-500" /></div>
            <h2 className="text-lg font-bold text-heading-text-black uppercase tracking-wider">Top Readers</h2>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex bg-primary-grey rounded-lg p-1 mb-4">
        <button
            onClick={() => setMode('books')}
            className={clsx("flex-1 py-1 text-xs font-bold rounded-md transition", mode === 'books' ? 'bg-white shadow text-black' : 'text-text-grey hover:text-black')}
        >
            By Books
        </button>
        <button
            onClick={() => setMode('pages')}
            className={clsx("flex-1 py-1 text-xs font-bold rounded-md transition", mode === 'pages' ? 'bg-white shadow text-black' : 'text-text-grey hover:text-black')}
        >
            By Pages
        </button>
      </div>

      <ul className="space-y-2 text-text-grey flex-grow">
        {itemsToShow.map((item, i) => (
          <li key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-primary-grey">
            <span className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{medals[i] || `${i + 1}.`}</span>
              <span className="font-semibold text-heading-text-black">{item.name}</span>
            </span>
            <div className="text-right">
                {mode === 'books' ? (
                     <span className="font-bold text-sm">{item.count} <span className="font-normal text-xs">books</span></span>
                ) : (
                     <span className="font-bold text-sm">{item.totalPagesRead.toLocaleString()} <span className="font-normal text-xs">pages</span></span>
                )}
            </div>
          </li>
        ))}
        {sortedData.length === 0 && <li className="text-center text-sm p-4">No reading data yet.</li>}
      </ul>
      {sortedData.length > 3 && (
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
          {isExpanded ? <>Show Less <ChevronUp size={16} /></> : <>Show Top 10 <ChevronDown size={16} /></>}
        </button>
      )}
    </div>
  )
}

// Standard Leaderboard for Books/Batches
function LeaderboardCard({ title, icon, data, unit }: { title: string; icon: ReactNode; data: RankedItem[]; unit: string }) {
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
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
          {isExpanded ? <>Show Less <ChevronUp size={16} /></> : <>Show Top 10 <ChevronDown size={16} /></>}
        </button>
      )}
    </div>
  )
}

// ✨ NEW: History Item with Tooltip support
function HistoryItem({ record, isReturnedList }: { record: any, isReturnedList: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="border-b border-primary-dark-grey pb-3 last:border-b-0 relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="flex items-center gap-2 cursor-help">
         <p className="font-semibold text-heading-text-black hover:text-blue-600 transition-colors">
           {record.books?.title || 'Unknown Book'}
         </p>
         <Info size={14} className="text-text-grey opacity-50 group-hover:opacity-100" />
      </div>

      {/* Tooltip */}
      {showTooltip && record.books && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
           <div className="space-y-1">
             <p><span className="font-bold text-gray-400">Author:</span> {record.books.author || 'N/A'}</p>
             <p><span className="font-bold text-gray-400">Barcode:</span> {record.books.barcode}</p>
             <p><span className="font-bold text-gray-400">Pages:</span> {record.books.pages || '-'}</p>
             <p><span className="font-bold text-gray-400">Shelf:</span> {record.books.shelf_location || 'N/A'}</p>
           </div>
           <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-grey mt-1">
        <span><Calendar size={12} className="inline mr-1" /><strong>Borrowed:</strong> {dayjs(record.borrow_date).format('DD MMM YYYY')}</span>
        {isReturnedList ? (
            <span><Check size={12} className="inline mr-1" /><strong>Returned:</strong> {dayjs(record.return_date).format('DD MMM YYYY')}</span>
        ) : (
            <span><Clock size={12} className="inline mr-1" /><strong>Due:</strong> {dayjs(record.due_date).format('DD MMM YYYY')}</span>
        )}
        {record.fine > 0 && (
          <span className={record.fine_paid ? 'text-green-600' : 'text-red-600'}>
            <strong>Fine:</strong> ₹{record.fine} {record.fine_paid ? '(Paid)' : '(Unpaid)'}
          </span>
        )}
      </div>
    </div>
  );
}

function HistoryList({ title, records, isReturnedList }: { title: string; records: any[]; isReturnedList: boolean }) {
  return (
    <div>
      <h3 className={clsx("text-lg font-bold mb-3", isReturnedList ? 'text-green-700' : 'text-red-700')}>{title}</h3>
      <div className="space-y-3 text-sm">
        {records.length === 0 ? <p className="text-text-grey text-sm p-4 bg-primary-grey rounded-md">No records in this category.</p> : (
          records.map((record, index) => (
            <HistoryItem key={index} record={record} isReturnedList={isReturnedList} />
          ))
        )}
      </div>
    </div>
  )
}

function DetailsModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-primary-dark-grey" onClick={e => e.stopPropagation()}>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div className="bg-primary-grey rounded-lg p-4 flex items-center gap-4 border border-primary-dark-grey">
      <div className="bg-secondary-white p-3 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-text-grey font-semibold">{label}</p>
        <p className="text-2xl font-bold text-heading-text-black">{value}</p>
      </div>
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