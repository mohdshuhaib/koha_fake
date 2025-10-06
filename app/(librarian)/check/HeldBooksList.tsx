'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Book, User, Clock, CheckCircle2 } from 'lucide-react'

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
  const [releasingId, setReleasingId] = useState<string | null>(null)

  const fetchHeldBooks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('hold_records')
      .select(`id, hold_date, book:books!inner(id, title, barcode), member:members!inner(id, name, barcode)`)
      .eq('released', false)
      .order('hold_date', { ascending: true })

    if (error) {
      console.error(error)
      setMessage('Failed to load held books.')
    } else {
      setRecords((data as any) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHeldBooks()
  }, [])

  const releaseBook = async (record: HeldRecord) => {
    setReleasingId(record.id)
    setMessage('')

    // This will now work because you created the function in the database
    const { error } = await supabase.rpc('release_held_book', {
      p_hold_id: record.id,
      p_book_id: record.book.id
    })

    if (error) {
      setMessage(`Failed to release "${record.book.title}". Please try again.`)
      console.error(error)
    } else {
      setRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
    }
    setReleasingId(null)
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-text-grey text-center py-8">Loading held books...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-10 px-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-heading-text-black">All Clear!</h3>
          <p className="mt-1 text-sm text-text-grey">There are no books currently on hold.</p>
        </div>
      ) : (
        records.map((r) => (
          <div key={r.id} className="bg-primary-grey border border-primary-dark-grey p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all">
            <div className="space-y-2 text-sm flex-grow">
              <div className="flex items-center gap-2 font-bold text-lg text-heading-text-black">
                <Book size={16} className="text-dark-green flex-shrink-0" />
                <span>{r.book.title}</span>
              </div>
              <div className="flex items-center gap-2 text-text-grey">
                <User size={14} className="flex-shrink-0" />
                <span>Held for: <strong className="text-heading-text-black">{r.member.name}</strong> ({r.member.barcode})</span>
              </div>
              <div className="flex items-center gap-2 text-text-grey">
                <Clock size={14} className="flex-shrink-0" />
                <span>Held on: {new Date(r.hold_date).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={() => releaseBook(r)} disabled={!!releasingId} className="w-full md:w-auto px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-70 disabled:cursor-wait flex-shrink-0">
              {releasingId === r.id ? 'Releasing...' : 'Mark Available'}
            </button>
          </div>
        ))
      )}
      {message && <p className="text-sm text-red-600 font-medium text-center">{message}</p>}
    </div>
  )
}
