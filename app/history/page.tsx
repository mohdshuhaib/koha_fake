'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

type Record = {
  id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  members: { name: string }
  books: { title: string }
}

type Ranked = {
  name: string
  count: number
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [topMembers, setTopMembers] = useState<Ranked[]>([])
  const [topBooks, setTopBooks] = useState<Ranked[]>([])
  const [topBatches, setTopBatches] = useState<Ranked[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchData()
    fetchTopMembers()
    fetchTopBooks()
    fetchTopBatches()
  }, [])

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
      // Normalize potential array values
      const normalized = data.map((r: any) => ({
        id: r.id,
        borrow_date: r.borrow_date,
        due_date: r.due_date,
        return_date: r.return_date,
        members: Array.isArray(r.members) ? r.members[0] : r.members,
        books: Array.isArray(r.books) ? r.books[0] : r.books,
      }))
      setRecords(normalized)
    }
  }

  const fetchTopMembers = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('member_id, members(name, category)')

    if (!error && data) {
      const counts: { [memberId: string]: Ranked } = {}

      data.forEach((d: any) => {
        const member = Array.isArray(d.members) ? d.members[0] : d.members
        const name = member?.name
        const category = member?.category

        // Only count if category is "student"
        if (!name || category !== 'student') return

        if (!counts[d.member_id]) {
          counts[d.member_id] = { name, count: 1 }
        } else {
          counts[d.member_id].count++
        }
      })

      const sorted: Ranked[] = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopMembers(sorted)
    }
  }

  const fetchTopBooks = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('book_id, books(title)')

    if (!error && data) {
      const counts: { [bookId: string]: Ranked } = {}

      data.forEach((d: any) => {
        const book = Array.isArray(d.books) ? d.books[0] : d.books
        const title = book?.title
        if (!title) return

        if (!counts[d.book_id]) {
          counts[d.book_id] = { name: title, count: 1 }
        } else {
          counts[d.book_id].count++
        }
      })

      const sorted: Ranked[] = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5)
      setTopBooks(sorted)
    }
  }

  const fetchTopBatches = async () => {
    const { data, error } = await supabase
      .from('borrow_records')
      .select('id, member_id, members(batch, category)') // fetch category too

    if (!error && data) {
      const counts: { [batch: string]: number } = {}

      data.forEach((record: any) => {
        const member = Array.isArray(record.members) ? record.members[0] : record.members
        const batch = member?.batch
        const category = member?.category

        if (!batch || category === 'class') return // exclude 'class' members

        counts[batch] = (counts[batch] || 0) + 1
      })

      const sorted: Ranked[] = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopBatches(sorted)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = confirm('Are you sure you want to delete this record?')
    if (!confirmed) return

    const { error } = await supabase.from('borrow_records').delete().eq('id', id)

    if (error) {
      alert('Failed to delete the record.')
      console.error(error)
    } else {
      alert('Record deleted successfully.')
      setRecords((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const getStatus = (r: Record) => {
    if (r.return_date) return 'Returned'
    if (dayjs().isAfter(r.due_date)) return 'Overdue'
    return 'Borrowed'
  }

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4">
      <div
        className="max-w-7xl mx-auto space-y-10"
      >
        <h1 className="text-3xl font-bold text-center text-heading-text-black font-heading">📚 Borrow & Return History</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6">
            <h2 className="text-lg font-semibold text-heading-text-black mb-3">🏅 Top 5 Readers</h2>
            <ol className="list-decimal ml-6 space-y-1 text-text-grey">
              {topMembers.map((m, i) => (
                <li key={i}>
                  {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} {m.name} ({m.count} books)
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6">
            <h2 className="text-lg font-semibold text-heading-text-black mb-3">📖 Top 5 Books</h2>
            <ol className="list-decimal ml-6 space-y-1 text-text-grey font-malayalam">
              {topBooks.map((b, i) => (
                <li key={i}>
                  {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} {b.name} ({b.count} times)
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6">
            <h2 className="text-lg font-semibold text-heading-text-black mb-3">🎓 Top Batches</h2>
            <ol className="list-decimal ml-6 space-y-1 text-text-grey">
              {topBatches.map((b, i) => (
                <li key={i}>
                  {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} {b.name} ({b.count} checkouts)
                </li>
              ))}
            </ol>
          </div>

        </div>

        <div className=" bg-secondary-white border border-primary-dark-grey rounded-xl overflow-x-auto p-4 shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="text-white border-b border-primary-dark-grey bg-secondary-light-black sticky top-0">
              <tr>
                <th className="text-left p-3">Member</th>
                <th className="text-left p-3">Book</th>
                <th className="text-left p-3">Borrowed</th>
                <th className="text-left p-3">Due</th>
                <th className="text-left p-3">Returned</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Delete</th>
              </tr>
            </thead>
            <tbody>
              {records.slice((page - 1) * pageSize, page * pageSize).map((r) => (
                <tr key={r.id} className="border-t border-primary-dark-grey hover:bg-primary-dark-grey transition text-text-grey">
                  <td className="p-3">{r.members?.name}</td>
                  <td className="p-3 font-malayalam">{r.books?.title}</td>
                  <td className="p-3">{dayjs(r.borrow_date).format('DD MMM')}</td>
                  <td className="p-3">{dayjs(r.due_date).format('DD MMM')}</td>
                  <td className="p-3">{r.return_date ? dayjs(r.return_date).format('DD MMM') : '-'}</td>
                  <td className="p-3">
                    {getStatus(r) === 'Returned' && <span className="text-green-600 font-medium">Returned</span>}
                    {getStatus(r) === 'Overdue' && <span className="text-yellow-600 font-medium">Overdue</span>}
                    {getStatus(r) === 'Borrowed' && <span className="text-blue-600 font-medium">Borrowed</span>}
                  </td>
                  <td className='p-3'>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="ml-2 text-red-600 hover:text-red-800 underline"
                      title="Delete this record"
                    >
                      Delete
                    </button></td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 pb-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1 rounded bg-button-yellow border text-button-text-black border-primary-dark-grey hover:bg-primary-dark-grey disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="px-4 text-heading-text-black">Page {page}</span>
          <button
            disabled={page * pageSize >= records.length}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1 rounded bg-button-yellow border text-button-text-black border-primary-dark-grey hover:bg-primary-dark-grey disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
