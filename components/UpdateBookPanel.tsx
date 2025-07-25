'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BookData {
  title: string
  author: string
  language: string
  shelf_location: string
  call_number: string
  barcode: string
}

export default function UpdateBookSidebar({ showSidebar, setShowSidebar }: { showSidebar: boolean; setShowSidebar: (val: boolean) => void }) {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [book, setBook] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSidebar) {
      setTimeout(() => barcodeRef.current?.focus(), 100)
    } else {
      resetForm()
    }
  }, [showSidebar])

  const fetchBook = async () => {
    setLoading(true)
    setMessage('')
    setBook(null)
    const { data, error } = await supabase.from('books').select('*').eq('barcode', barcodeInput).single()

    if (error || !data) {
      setMessage('❌ Book not found')
      setLoading(false)
      return
    }

    setBook(data)
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!book) return
    setLoading(true)
    resetForm()
    setMessage('')

    const { error } = await supabase
      .from('books')
      .update({
        title: book.title,
        author: book.author,
        shelf_location: book.shelf_location,
        call_number: book.call_number,
      })
      .eq('barcode', book.barcode)

    if (error) {
      setMessage('❌ Failed to update book')
    } else {
      setMessage('✅ Book updated successfully')
    }

    setLoading(false)
  }

  const resetForm = () => {
    setBarcodeInput('')
    setBook(null)
    setMessage('')
    setLoading(false)
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[22rem] max-w-full bg-secondary-white border-l border-primary-dark-grey shadow-2xl transition-transform duration-300 z-[70] ${
        showSidebar ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center px-4 py-4 border-b border-primary-dark-grey">
        <h2 className="text-xl font-bold text-heading-text-black font-heading">✏️ Update Book</h2>
        <button onClick={() => setShowSidebar(false)} className="text-red-600 hover:text-red-700 font-extrabold transition text-xl">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!book && (
          <>
            <input
              ref={barcodeRef}
              type="text"
              placeholder="📘 Enter book barcode"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBook()}
            />
            <button
              onClick={fetchBook}
              className="bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-medium px-6 py-2 rounded-lg shadow-md transition disabled:opacity-50"
              disabled={loading || !barcodeInput}
            >
              {loading ? '🔍 Searching...' : '🔍 Fetch Book'}
            </button>
            {message && <p className="text-sm text-text-grey pt-1">{message}</p>}
          </>
        )}

        {book && (
          <div className="space-y-4">
            <p className='text-sm font-medium'>Title</p>
            <input
              type="text"
              value={book.title}
              onChange={(e) => setBook({ ...book, title: e.target.value })}
              placeholder="📖 Title"
              className="w-full px-4 py-3 font-malayalam rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Author</p>
            <input
              type="text"
              value={book.author}
              onChange={(e) => setBook({ ...book, author: e.target.value })}
              placeholder="✍️ Author"
              className="w-full px-4 font-malayalam py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Language</p>
            <input
              type="text"
              value={book.language}
              readOnly
              placeholder="🗣️ Language"
              className="w-full px-4 py-3 bg-primary-dark-grey border border-primary-dark-grey text-text-grey rounded-lg cursor-not-allowed"
            />
            <p className='text-sm font-medium'>Shelf Location</p>
            <input
              type="text"
              value={book.shelf_location}
              onChange={(e) => setBook({ ...book, shelf_location: e.target.value })}
              placeholder="📍 Shelf Location"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Call Number</p>
            <input
              type="text"
              value={book.call_number}
              onChange={(e) => setBook({ ...book, call_number: e.target.value })}
              placeholder="🧾 Call Number"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Barcode</p>
            <input
              type="text"
              value={book.barcode}
              readOnly
              placeholder="🔢 Barcode"
              className="w-full px-4 py-3 bg-primary-dark-grey border border-primary-dark-grey text-text-grey rounded-lg cursor-not-allowed"
            />
            <button
              onClick={handleUpdate}
              className="bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-medium px-6 py-2 rounded-lg shadow-md transition"
              disabled={loading}
            >
              {loading ? '⏳ Updating...' : '💾 Update Book'}
            </button>
            {message && <p className="text-sm text-text-grey pt-1">{message}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
