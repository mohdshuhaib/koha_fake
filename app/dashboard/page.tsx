'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '../loading'
import dayjs from 'dayjs'
import {
  BookCopy,
  Users,
  ArrowRightLeft,
  IndianRupee,
  X,
  Languages,
  BookText,
  AlertTriangle
} from 'lucide-react'
import React from 'react'
import clsx from 'classnames'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBooks: 0, malBooks: 0, engBooks: 0, urdBooks: 0, arbBooks: 0,
    totalMembers: 0, borrowedNow: 0, pendingFines: 0,
  })
  const [dueTomorrow, setDueTomorrow] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allDueBooks, setAllDueBooks] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  // ✨ State for the modal's batch filter
  const [selectedBatch, setSelectedBatch] = useState('All')

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const tomorrowStart = dayjs().add(1, 'day').startOf('day').toISOString()
      const tomorrowEnd = dayjs().add(1, 'day').endOf('day').toISOString()

      const [
        { count: books }, { count: members }, { count: borrowed },
        { data: finesData }, { data: dueTomorrowData }, { count: malBooks },
        { count: engBooks }, { count: urdBooks }, { count: arbBooks },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('borrow_records').select('*', { count: 'exact', head: true }).is('return_date', null),
        supabase.from('borrow_records').select('fine').eq('fine_paid', false).gt('fine', 0),
        // ✨ Fetch batch in the query for member data
        supabase.from('borrow_records').select(`id, book:book_id(title, barcode), member:member_id(name, batch)`).is('return_date', null).gte('due_date', tomorrowStart).lt('due_date', tomorrowEnd),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'MAL'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'ENG'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'URD'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'ARB'),
      ])

      const pendingFinesTotal = finesData?.reduce((sum, r) => sum + (r.fine || 0), 0) || 0

      setStats({
        totalBooks: books || 0, malBooks: malBooks || 0, engBooks: engBooks || 0,
        urdBooks: urdBooks || 0, arbBooks: arbBooks || 0, totalMembers: members || 0,
        borrowedNow: borrowed || 0, pendingFines: pendingFinesTotal,
      })
      setDueTomorrow(dueTomorrowData || [])
      setLoading(false)
    }
    checkAuthAndFetchStats()
  }, [router])

  const fetchAllDueBooks = async () => {
    setIsModalOpen(true)
    setModalLoading(true)
    setSelectedBatch('All'); // ✨ Reset filter when opening modal

    // ✨ Fetch member's batch along with other data
    const { data, error } = await supabase.from('borrow_records').select(`id, due_date, book:book_id(title), member:member_id(name, batch)`).is('return_date', null).order('due_date', { ascending: true })
    if (data) setAllDueBooks(data)
    if (error) {
      console.error("Failed to fetch all due books:", error)
      setAllDueBooks([])
    }
    setModalLoading(false)
  }

  // ✨ Derive unique batches and filtered list for the modal
  const uniqueBatches = ['All', ...Array.from(new Set(allDueBooks.map(book => book.member?.batch).filter(Boolean)))];
  const filteredDueBooks = selectedBatch === 'All'
    ? allDueBooks
    : allDueBooks.filter(book => book.member?.batch === selectedBatch);

  const languageBreakdown = [
    { label: 'Malayalam', count: stats.malBooks, color: 'bg-yellow-400' },
    { label: 'English', count: stats.engBooks, color: 'bg-blue-400' },
    { label: 'Urdu', count: stats.urdBooks, color: 'bg-red-400' },
    { label: 'Arabic', count: stats.arbBooks, color: 'bg-green-400' },
  ]

  if (loading) return <div className="p-16"><Loading /></div>

  return (
    <>
      <main className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-4xl uppercase font-heading font-bold text-heading-text-black tracking-wider">
            Library Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Books" value={stats.totalBooks} icon={<BookCopy className="text-blue-500" />} />
            <StatCard label="Total Members" value={stats.totalMembers} icon={<Users className="text-purple-500" />} />
            <StatCard label="Borrowed Now" value={stats.borrowedNow} icon={<ArrowRightLeft className="text-orange-500" />} />
            <StatCard label="Pending Fines" value={`₹${stats.pendingFines}`} icon={<IndianRupee className="text-red-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-secondary-white rounded-xl p-6 shadow-lg border border-primary-dark-grey">
              <div className='flex items-center gap-3 mb-4'>
                <Languages className='text-icon-green' />
                <h2 className="text-xl font-bold font-heading text-heading-text-black">Book Collection by Language</h2>
              </div>
              <div className="space-y-3">
                {languageBreakdown.map(({ label, count, color }) => {
                  const percent = stats.totalBooks > 0 ? (count / stats.totalBooks) * 100 : 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm font-semibold text-text-grey mb-1">
                        <span>{label}</span>
                        <span>{count} / {stats.totalBooks}</span>
                      </div>
                      <div className="w-full bg-primary-dark-grey h-2.5 rounded-full">
                        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-secondary-white rounded-xl p-6 shadow-lg border border-primary-dark-grey">
              <div className='flex items-center gap-3 mb-4'>
                <BookText className='text-icon-green' />
                <h2 className="text-xl font-bold font-heading text-heading-text-black">Due Tomorrow</h2>
              </div>
              {dueTomorrow.length > 0 ? (
                <ul className="space-y-3">
                  {dueTomorrow.map(r => (
                    <li key={r.id} className="text-sm p-3 bg-primary-grey rounded-md border border-primary-dark-grey">
                      <p className="font-bold text-heading-text-black">{r.book?.title || 'Unknown Book'}</p>
                      <p className="text-text-grey">by {r.member?.name || 'Unknown Member'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-grey text-center py-8">No books are due for return tomorrow.</p>
              )}
              <button onClick={fetchAllDueBooks} className="w-full mt-4 bg-button-yellow text-button-text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition">
                View All Unreturned Books
              </button>
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="All Unreturned Books">
        {modalLoading ? (
          <div className="p-8"><Loading /></div>
        ) : allDueBooks.length === 0 ? (
          <p className="p-8 text-text-grey text-center">No outstanding books found. Great job!</p>
        ) : (
          <div className="flex flex-col">
            {/* ✨ Batch Filter Buttons */}
            <div className="p-4 border-b border-primary-dark-grey flex flex-wrap gap-2">
              {uniqueBatches.map(batch => (
                <button
                  key={batch}
                  onClick={() => setSelectedBatch(batch)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold transition",
                    selectedBatch === batch ? 'bg-blue-600 text-white' : 'bg-primary-grey text-text-grey hover:bg-primary-dark-grey'
                  )}
                >
                  {batch}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto max-h-[65vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-secondary-light-black text-white">
                  <tr>
                    <th className="p-3 text-left font-semibold uppercase tracking-wider">Book</th>
                    <th className="p-3 text-left font-semibold uppercase tracking-wider">Member</th>
                    <th className="p-3 text-left font-semibold uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-secondary-white">
                  {/* ✨ Map over the filtered list */}
                  {filteredDueBooks.map(r => {
                    const isOverdue = dayjs().isAfter(dayjs(r.due_date), 'day')
                    return (
                      <tr key={r.id} className="border-t border-primary-dark-grey">
                        <td className="p-3 text-heading-text-black font-semibold">{r.book?.title}</td>
                        <td className="p-3 text-text-grey">{r.member?.name}</td>
                        <td className={clsx("p-3 font-semibold flex items-center gap-2", isOverdue ? 'text-red-600' : 'text-text-grey')}>
                          {isOverdue && <AlertTriangle size={14} />}
                          {dayjs(r.due_date).format('DD MMM YYYY')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredDueBooks.length === 0 && <p className="text-center p-6 text-text-grey">No unreturned books for this batch.</p>}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-secondary-white rounded-xl p-5 shadow-lg flex items-center gap-4 border border-primary-dark-grey transition hover:shadow-xl hover:-translate-y-1">
      <div className="bg-primary-grey p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-grey font-semibold">{label}</p>
        <p className="text-2xl font-bold text-heading-text-black">{value}</p>
      </div>
    </div>
  )
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-3xl w-full flex flex-col border border-primary-dark-grey">
        <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
          <h2 className="text-xl font-bold font-heading text-heading-text-black">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition">
            <X size={20} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}
