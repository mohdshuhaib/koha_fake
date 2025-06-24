'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeleteAllBooks() {
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')

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

  // Step 2: Delete related borrow_records
  const { error: borrowDeleteError } = await supabase
    .from('borrow_records')
    .delete()
    .in('book_id', bookIds)

  if (borrowDeleteError) return setMessage('Failed to delete borrow records.')

  // Step 3: Delete books
  const { error: bookDeleteError } = await supabase
    .from('books')
    .delete()
    .in('id', bookIds)

  if (bookDeleteError) return setMessage('Failed to delete books.')

  setMessage('All books and borrow records deleted.')
  setConfirm('')
}

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4 text-red-700">🔥 Delete ALL Books & Records</h2>
      <p className="mb-2">Type <code>DELETE</code> to confirm:</p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleDeleteAll}
        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
      >
        Delete Everything
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
