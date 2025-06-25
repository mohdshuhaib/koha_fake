'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeleteBookPage() {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!barcode) return setMessage('Enter a barcode.')

    // 1. Get the book by barcode
    const { data: book, error } = await supabase
      .from('books')
      .select('id')
      .eq('barcode', barcode)
      .single()

    if (error || !book) return setMessage('Book not found.')
      setLoading(true)

    // 2. Delete related borrow_records
    await supabase.from('borrow_records').delete().eq('book_id', book.id)

    // 3. Delete the book itself
    await supabase.from('books').delete().eq('id', book.id)

    setMessage('Book and its records deleted.')
    setBarcode('')
  }

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-gradient-to-br from-primary via-secondary to-sidekick text-white">
      <div className="max-w-lg mx-auto bg-white/5 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20 space-y-6">
        <h1 className="text-3xl font-bold text-center text-sidekick-dark">
          🗑️ Delete Book by Barcode
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          />

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Member'}
          </button>

          {message && (
            <p className="text-sm text-white/80 mt-2">{message}</p>
          )}
        </div>
      </div>
    </main>
  )
}
