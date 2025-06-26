'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'

type Book = {
  id: number
  barcode: string
  title: string
  author: string
  language: string
  call_number: string
  status: 'available' | 'borrowed' | 'held'
  borrow_records?: {
    return_date: string | null
    members: {
      name: string
    }
  }[]
  hold_records?: {
    released: boolean
    hold_date: string
    member: {
      name: string
    }
  }[]
}

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          borrow_records (
            return_date,
            members (
              name
            )
          ),
          hold_records (
          released,
          hold_date,
          member:members (
          name
        )
      )
        `)

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
      book.barcode.toLowerCase().includes(query) ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.call_number.toLowerCase().includes(query) ||
      book.language.toLowerCase().includes(query)
    )
    setFilteredBooks(results)
  }, [search, books])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pt-24 px-4 text-white">
      <div
        className="max-w-6xl mx-auto backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-sidekick-dark text-center">
          📚 Book Catalog
        </h1>

        <input
          type="text"
          placeholder="Search by title, author, language or call number"
          className="w-full p-3 mb-6 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sidekick transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredBooks.length === 0 ? (
          <p className="text-white/60 text-center">No books found in the catalog.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto">
              <div className="max-h-[65vh] overflow-y-auto rounded-md border border-white/20 shadow-inner custom-scroll">
                <table className="min-w-full text-sm text-left">
                  <thead className="sticky top-0 z-10 bg-[#1a1a1a]/80 backdrop-blur-sm text-white border-b border-white/20">
                    <tr>
                      <th className="px-4 py-3">Barcode</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Language</th>
                      <th className="px-4 py-3">Call Number</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => {
                      const activeBorrow = book.borrow_records?.find(
                        (br) => br.return_date === null
                      )
                      const borrowedBy = activeBorrow?.members?.name

                      const activeHold = book.hold_records?.find(
                        (hr) => hr.released === false
                      )
                      const heldBy = activeHold?.member?.name

                      return (
                        <tr key={book.id} className="border-t border-white/10 hover:bg-white/5 transition">
                          <td className="px-4 py-3">{book.barcode}</td>
                          <td className="px-4 py-3">{book.title}</td>
                          <td className="px-4 py-3">{book.author}</td>
                          <td className="px-4 py-3">{book.language}</td>
                          <td className="px-4 py-3">{book.call_number}</td>
                          <td className="px-4 py-3">
                            {book.status === 'available' ? (
                              <span className="text-green-400 font-medium">Available</span>
                            ) : book.status === 'held' ? (
                              <span className="text-yellow-400 font-medium">
                                Held by {heldBy ?? 'Unknown'}
                              </span>
                            ) : (
                              <span className="text-red-400 font-medium">
                                Checked out to {borrowedBy ?? 'Unknown'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
