'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeleteMultipleBooks() {
  const [barcodes, setBarcodes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBulkDelete = async () => {
    const barcodeList = barcodes.split(',').map((b) => b.trim()).filter(Boolean)

    if (!barcodeList.length) return setMessage('Enter valid barcodes.')

    // Get all book IDs for barcodes
    const { data: books } = await supabase
      .from('books')
      .select('id, barcode')
      .in('barcode', barcodeList)

    const bookIds = books?.map((b) => b.id)

    if (!bookIds?.length) return setMessage('No matching books found.')
    setLoading(true)
    // Delete from borrow_records
    await supabase.from('borrow_records').delete().in('book_id', bookIds)

    // Delete from books
    await supabase.from('books').delete().in('id', bookIds)

    setMessage(`${bookIds.length} books and related records deleted.`)
    setBarcodes('')
  }

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-gradient-to-br from-primary via-secondary to-sidekick text-white">
      <div className="max-w-lg mx-auto bg-white/5 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20 space-y-6">
        <h1 className="text-3xl font-bold text-center text-sidekick-dark">
          🗑️ Delete Multiple Books
        </h1>

        <div className="space-y-4">
          <textarea
            value={barcodes}
            onChange={(e) => setBarcodes(e.target.value)}
            placeholder="Enter barcodes separated by commas (e.g. u445,u446,u447)"
            className="w-full h-36 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-400 transition resize-none"
          />

          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Books'}
          </button>

          {message && (
            <p className="text-sm text-white/80 mt-2">{message}</p>
          )}
        </div>
      </div>
    </main>
  )
}
