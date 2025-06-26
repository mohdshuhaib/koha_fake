'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HeldRecord = {
  id: string
  hold_date: string
  book: {
    id: string
    title: string
    barcode: string
  }
  member: {
    id: string
    name: string
    barcode: string
  }
}

export default function HeldBooksList() {
  const [records, setRecords] = useState<HeldRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchHeldBooks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('hold_records')
      .select(`
    id,
    hold_date,
    released,
    book:books(id, title, barcode),
    member:members(id, name, barcode)
  `)
      .eq('released', false)

    if (error) {
      console.error(error)
    } else {
      const normalized = (data ?? []).map((r: any) => ({
        id: r.id,
        hold_date: r.hold_date,
        book: r.book,
        member: r.member,
      }))

      setRecords(normalized)

    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHeldBooks()
  }, [])

  const releaseBook = async (record: HeldRecord) => {
    setMessage('Releasing...')

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'available' })
      .eq('id', record.book.id)

    const { error: holdError } = await supabase
      .from('hold_records')
      .update({ released: true })
      .eq('id', record.id)

    if (bookError || holdError) {
      setMessage('❌ Failed to release book')
    } else {
      setMessage(`✅ Released "${record.book.title}"`)
      fetchHeldBooks()
    }

    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="space-y-4 text-white">
      {loading ? (
        <p className="text-white/80">⏳ Loading held books...</p>
      ) : records.length === 0 ? (
        <p className="text-white/50">📭 No books currently held.</p>
      ) : (
        records.map((r) => (
          <div
            key={r.id}
            className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition hover:bg-white/20"
          >
            <div className="space-y-1 text-sm sm:text-base">
              <p className="font-semibold text-sidekick-dark">{r.book.title}</p>
              <p className="text-white/80">
                📚 <span className="text-white">{r.book.barcode}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                👤 <span className="text-white">{r.member.name}</span> ({r.member.barcode})
              </p>
              <p className="text-white/60">
                ⏳ Held on: <span className="text-white">{new Date(r.hold_date).toLocaleString()}</span>
              </p>
            </div>
            <button
              onClick={() => releaseBook(r)}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
              disabled={loading}
            >
              ✅ Mark Available
            </button>
          </div>
        ))
      )}
      {message && <p className="text-sm text-white/70">{message}</p>}
    </div>
  )
}
