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
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchData()
    fetchTopMembers()
    fetchTopBooks()
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
      .select('member_id, members(name)')

    if (!error && data) {
      const counts: { [memberId: string]: Ranked } = {}

      data.forEach((d: any) => {
        const member = Array.isArray(d.members) ? d.members[0] : d.members
        const name = member?.name
        if (!name) return

        if (!counts[d.member_id]) {
          counts[d.member_id] = { name, count: 1 }
        } else {
          counts[d.member_id].count++
        }
      })

      const sorted: Ranked[] = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3)
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

      const sorted: Ranked[] = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3)
      setTopBooks(sorted)
    }
  }

  const getStatus = (r: Record) => {
    if (r.return_date) return 'Returned'
    if (dayjs().isAfter(r.due_date)) return 'Overdue'
    return 'Borrowed'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">📚 Borrow & Return History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">🏅 Top 3 Readers</h2>
          <ol className="list-decimal ml-6 space-y-1">
            {topMembers.map((m, i) => (
              <li key={i}>
                {['🥇', '🥈', '🥉'][i]} {m.name} ({m.count} books)
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">📖 Top 3 Books</h2>
          <ol className="list-decimal ml-6 space-y-1">
            {topBooks.map((b, i) => (
              <li key={i}>
                {['🥇', '🥈', '🥉'][i]} {b.name} ({b.count} times)
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b font-semibold">
              <th className="text-left p-2">Member</th>
              <th className="text-left p-2">Book</th>
              <th className="text-left p-2">Borrowed</th>
              <th className="text-left p-2">Due</th>
              <th className="text-left p-2">Returned</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.slice((page - 1) * pageSize, page * pageSize).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.members?.name}</td>
                <td className="p-2">{r.books?.title}</td>
                <td className="p-2">{dayjs(r.borrow_date).format('DD MMM')}</td>
                <td className="p-2">{dayjs(r.due_date).format('DD MMM')}</td>
                <td className="p-2">
                  {r.return_date ? dayjs(r.return_date).format('DD MMM') : '-'}
                </td>
                <td className="p-2">{getStatus(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * pageSize >= records.length}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      </div>
    </div>
  )
}
