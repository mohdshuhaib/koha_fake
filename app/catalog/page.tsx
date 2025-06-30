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
  shelf_location: string
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

const PAGE_SIZE = 50

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)

  useEffect(() => {
    fetchBooks()
  }, [page, search])

  const fetchBooks = async () => {
  setLoading(true)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('books')
    .select(
      `
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
      `,
      { count: 'exact' }
    )

  // Handle search across multiple columns
  if (search.trim()) {
    const searchText = `%${search.trim()}%`

    query = query.or(
      `title.ilike.${searchText},author.ilike.${searchText},language.ilike.${searchText},call_number.ilike.${searchText},barcode.ilike.${searchText}`
    )
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Search error:', error)
    setBooks([])
    setTotalBooks(0)
  } else {
    setBooks(data || [])
    setTotalBooks(count || 0)
  }

  setLoading(false)
}

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // reset to first page on new search
  }

  const totalPages = Math.ceil(totalBooks / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pt-24 px-4 text-white">
      <div className="max-w-6xl mx-auto backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-sidekick-dark text-center">📚 Book Catalog</h1>

        <input
          type="text"
          placeholder="Search by title, author, language, or call number"
          className="w-full p-3 mb-6 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sidekick transition"
          value={search}
          onChange={handleSearchChange}
        />

        {loading ? (
          <Loading />
        ) : books.length === 0 ? (
          <p className="text-white/60 text-center">No books found in the catalog.</p>
        ) : (
          <>
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
                      <th className="px-4 py-3">Shelf</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => {
                      const activeBorrow = book.borrow_records?.find((br) => br.return_date === null)
                      const borrowedBy = activeBorrow?.members?.name

                      const activeHold = book.hold_records?.find((hr) => !hr.released)
                      const heldBy = activeHold?.member?.name

                      return (
                        <tr key={book.id} className="border-t border-white/10 hover:bg-white/5 transition">
                          <td className="px-4 py-3">{book.barcode}</td>
                          <td className="px-4 py-3">{book.title}</td>
                          <td className="px-4 py-3">{book.author}</td>
                          <td className="px-4 py-3">{book.language}</td>
                          <td className="px-4 py-3">{book.call_number}</td>
                          <td className="px-4 py-3">{book.shelf_location}</td>
                          <td className="px-4 py-3">
                            {book.status === 'available' ? (
                              <span className="text-green-400 font-medium">Available</span>
                            ) : book.status === 'held' ? (
                              <span className="text-yellow-400 font-medium">Held by {heldBy ?? 'Unknown'}</span>
                            ) : (
                              <span className="text-red-400 font-medium">Checked out to {borrowedBy ?? 'Unknown'}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
              >
                ← Previous
              </button>

              <p className="text-white/70 text-sm">
                Page {page} of {totalPages}
              </p>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
