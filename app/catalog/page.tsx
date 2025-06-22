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

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-sidekick">📚 Book Catalog</h1>

        <input
          type="text"
          placeholder="Search by title, author, language or call number"
          className="w-full p-3 mb-6 rounded-md bg-[#1a1a1a] border border-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sidekick"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredBooks.length === 0 ? (
          <p className="text-gray-300">No books found in the catalog.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto rounded-md border border-secondary shadow-lg custom-scroll">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-secondary sticky top-0 z-10 text-left text-white">
                  <tr>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Author</th>
                    <th className="px-4 py-2">Language</th>
                    <th className="px-4 py-2">Call Number</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-[#1a1a1a] border-t border-gray-700">
                      <td className="px-4 py-3">{book.title}</td>
                      <td className="px-4 py-3">{book.author}</td>
                      <td className="px-4 py-3">{book.language}</td>
                      <td className="px-4 py-3">{book.call_number}</td>
                      <td className="px-4 py-3">
                        {book.status ? (
                          <span className="text-green-400 font-medium">Available</span>
                        ) : (
                          <span className="text-red-400 font-medium">Checked Out</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
