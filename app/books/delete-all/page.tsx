'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeleteAllBooks() {
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAll = async () => {
  if (confirm !== 'DELETE') {
    return setMessage('Type DELETE to confirm.')
  }

  // Step 1: Get all book IDs
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id')

  if (booksError) return setMessage('Failed to fetch books.')

  const bookIds = books?.map((b) => b.id)
  if (!bookIds.length) return setMessage('No books to delete.')
    setLoading(true)
  // Step 2: Delete related borrow_records
  const chunkArray = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )

const CHUNK_SIZE = 100  // Safe limit

for (const chunk of chunkArray(bookIds, CHUNK_SIZE)) {
  const { error: borrowDeleteError } = await supabase
    .from('borrow_records')
    .delete()
    .in('book_id', chunk)

  if (borrowDeleteError) return setMessage('Failed to delete borrow records.')

  const { error: holdDeleteError } = await supabase
    .from('hold_records')
    .delete()
    .in('book_id', chunk)

  if (holdDeleteError) return setMessage('Failed to delete hold records.')

  const { error: bookDeleteError } = await supabase
    .from('books')
    .delete()
    .in('id', chunk)

  if (bookDeleteError) return setMessage('Failed to delete books.')
}

  setMessage('All books and borrow records deleted.')
  setConfirm('')
  setLoading(false)
}

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-lg mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey space-y-6">
        <h1 className="text-3xl font-bold text-center text-heading-text-black">
          🔥 Delete ALL Books & Records
        </h1>

        <p className="text-sub-heading-text-grey">
          This action is irreversible. Type <code className="bg-secondary-light-black px-1 py-0.5 rounded text-red-600">DELETE</code> below to confirm:
        </p>

        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE here"
          className="w-full p-3 bg-secondary-white border border-red-600 rounded-lg text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-red-700 transition"
        />

        <button
          onClick={handleDeleteAll}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete Everything'}
        </button>

        {message && (
          <p className="text-sm text-text-grey mt-2">{message}</p>
        )}
      </div>
    </main>
  )
}
