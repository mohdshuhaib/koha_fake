'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '../loading'

type Book = {
  id: number
  title: string
  author: string
  language: string
  call_number: string
  status: boolean
}

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from('books').select('*')
      if (error) {
        console.error('Error fetching books:', error)
      } else {
        setBooks(data)
        setFilteredBooks(data)
      }
      setLoading(false)
    }

    fetchBooks()
  }, [])

  useEffect(() => {
    const query = search.toLowerCase()
    const results = books.filter((book) =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.call_number.toLowerCase().includes(query) ||
      book.language.toLowerCase().includes(query)
    )
    setFilteredBooks(results)
  }, [search, books])

  if (loading) return <Loading/>

  return (
    <div className="mt-6 max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📚 Book Catalog</h1>

      <input
        type="text"
        placeholder="Search by title, author, language or call number"
        className="w-full p-2 mb-4 border rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredBooks.length === 0 ? (
        <p>No books found in the catalog.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Title</th>
                <th className="border px-4 py-2 text-left">Author</th>
                <th className="border px-4 py-2 text-left">Language</th>
                <th className="border px-4 py-2 text-left">Call Number</th>
                <th className="border px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{book.title}</td>
                  <td className="border px-4 py-2">{book.author}</td>
                  <td className="border px-4 py-2">{book.language}</td>
                  <td className="border px-4 py-2">{book.call_number}</td>
                  <td className="border px-4 py-2">
                    {book.status ? (
                      <span className="text-green-600 font-medium">Available</span>
                    ) : (
                      <span className="text-red-600 font-medium">Checked Out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
