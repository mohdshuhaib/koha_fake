'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Book = {
  id: string
  title: string
  author: string
  shelf_location: string
  call_number: string
  language: string
  barcode: string
  status: string
}

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [noResult, setNoResult] = useState(false)

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true })
        console.log("📚 Books loaded:", data)
      if (!error && data) {
        setBooks(data)
      }
      setLoading(false)
    }
    fetchBooks()
  }, [])

  const handleSearch = () => {
    console.log("🔍 Find button clicked")
    setSearching(true)
    const query = search.trim().toLowerCase()

    const results = books.filter((book) => {
      const title = book.title?.toLowerCase() || ''
      const author = book.author?.toLowerCase() || ''
      const barcode = String(book.barcode || '').toLowerCase()

      return (
        title.includes(query) ||
        author.includes(query) ||
        barcode.includes(query)
      )
    })

    console.log('Searching for:', query)
    console.log('Books available:', books.length)
    console.log('Results found:', results.length)

    setFilteredBooks(results)
    setNoResult(results.length === 0)
    setSearching(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📖 Book Catalog</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter title, author or barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Find
        </button>
      </div>

      {loading ? (
        <p className="text-blue-600">Loading books...</p>
      ) : (
        <>
          {noResult ? (
            <p className="text-red-600 font-semibold">
              📛 Book not found for this result.
            </p>
          ) : filteredBooks.length > 0 ? (
            <div className="overflow-auto rounded shadow">
              <table className="w-full table-auto border-collapse text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2 border">Title</th>
                    <th className="p-2 border">Author</th>
                    <th className="p-2 border">Shelf</th>
                    <th className="p-2 border">Call No.</th>
                    <th className="p-2 border">Lang</th>
                    <th className="p-2 border">Barcode</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{book.title}</td>
                      <td className="p-2 border">{book.author}</td>
                      <td className="p-2 border">{book.shelf_location}</td>
                      <td className="p-2 border">{book.call_number}</td>
                      <td className="p-2 border">{book.language}</td>
                      <td className="p-2 border">{book.barcode}</td>
                      <td className="p-2 border">
                        <span
                          className={
                            book.status === 'available'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
