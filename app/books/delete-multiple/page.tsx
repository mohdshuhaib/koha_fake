'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeleteMultipleBooks() {
  const [barcodes, setBarcodes] = useState('')
  const [message, setMessage] = useState('')

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

    // Delete from borrow_records
    await supabase.from('borrow_records').delete().in('book_id', bookIds)

    // Delete from books
    await supabase.from('books').delete().in('id', bookIds)

    setMessage(`${bookIds.length} books and related records deleted.`)
    setBarcodes('')
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">🗑️ Delete Multiple Books</h2>
      <textarea
        value={barcodes}
        onChange={(e) => setBarcodes(e.target.value)}
        placeholder="Enter barcodes separated by commas"
        className="w-full h-32 border p-2 rounded mb-2"
      />
      <button
        onClick={handleBulkDelete}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Delete Books
      </button>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
    </div>
  )
}
