'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DeleteBookPage() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleDelete = async () => {
    if (!barcode) return setMessage('Enter a barcode.')

    // 1. Get the book by barcode
    const { data: book, error } = await supabase
      .from('books')
      .select('id')
      .eq('barcode', barcode)
      .single()

    if (error || !book) return setMessage('Book not found.')

    // 2. Delete related borrow_records
    await supabase.from('borrow_records').delete().eq('book_id', book.id)

    // 3. Delete the book itself
    await supabase.from('books').delete().eq('id', book.id)

    setMessage('Book and its records deleted.')
    setBarcode('')
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">🗑️ Delete Book by Barcode</h2>
      <input
        type="text"
        placeholder="Enter Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleDelete}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Delete Book
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
