'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'classnames'

// Data type remains the same
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

  // Data fetching logic is unchanged
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('books')
        .select(
          `*, borrow_records(return_date, members(name)), hold_records(released, hold_date, member:members(name))`,
          { count: 'exact' }
        ).order('barcode', { ascending: true })

      if (search.trim()) {
        const searchText = `%${search.trim()}%`
        query = query.or(`title.ilike.${searchText},author.ilike.${searchText},language.ilike.${searchText},call_number.ilike.${searchText},barcode.ilike.${searchText}`)
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
    fetchBooks()
  }, [page, search])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const totalPages = Math.ceil(totalBooks / PAGE_SIZE)

  return (
    // Restored original light theme background
    <div className="min-h-screen bg-primary-grey pt-24 px-4 font-body">
      {/* Restored main content card with modern padding */}
      <div className="max-w-7xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-heading-text-black font-heading uppercase text-center tracking-wider">
          Book Catalog
        </h1>

        {/* Redesigned search bar for the light theme */}
        <div className="relative mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-text-grey" />
          </div>
          <input
            type="text"
            placeholder="Search by title, author, language, or call number"
            className="w-full p-3 pl-12 rounded-lg bg-secondary-white border border-dark-green text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <div className="p-16"><Loading /></div>
        ) : books.length === 0 ? (
          <p className="py-16 text-text-grey text-center">No books found in the catalog.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="border border-primary-dark-grey rounded-lg shadow-inner">
                <table className="min-w-full text-sm text-left">
                  {/* Table header style from original for high contrast */}
                  <thead className="bg-secondary-light-black text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Barcode</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Author</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Language</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Call Number</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Shelf</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => {
                      const activeBorrow = book.borrow_records?.find((br) => br.return_date === null)
                      const borrowedBy = activeBorrow?.members?.name
                      const activeHold = book.hold_records?.find((hr) => !hr.released)
                      const heldBy = activeHold?.member?.name

                      return (
                        <tr key={book.id} className="border-b border-primary-dark-grey last:border-b-0 hover:bg-primary-grey transition-colors">
                          <td className="px-4 py-3 align-middle text-text-grey">{book.barcode}</td>
                          <td className="px-4 py-3 align-middle font-malayalam font-semibold text-heading-text-black">{book.title}</td>
                          <td className="px-4 py-3 align-middle font-malayalam text-text-grey">{book.author}</td>
                          <td className="px-4 py-3 align-middle text-text-grey">{book.language}</td>
                          <td className="px-4 py-3 align-middle text-text-grey">{book.call_number}</td>
                          <td className="px-4 py-3 align-middle text-text-grey">{book.shelf_location}</td>
                          <td className="px-4 py-3 align-middle">
                            <StatusBadge status={book.status} heldBy={heldBy} borrowedBy={borrowedBy} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls - styled for light theme */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-text-grey text-sm font-medium">
                Page {page} of {totalPages}
              </p>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-2 rounded-md bg-button-yellow text-button-text-black hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// --- Helper component for status badges, now styled for a LIGHT background ---
function StatusBadge({ status, heldBy, borrowedBy }: { status: string; heldBy?: string; borrowedBy?: string }) {
  const baseClasses = "px-2.5 py-1 rounded-full text-xs font-bold"

  switch (status) {
    case 'available':
      return <span className={clsx(baseClasses, "bg-green-100 text-green-800")}>Available</span>
    case 'held':
      return <span className={clsx(baseClasses, "bg-yellow-100 text-yellow-800")}>Held by {heldBy ?? 'Unknown'}</span>
    case 'borrowed':
      return <span className={clsx(baseClasses, "bg-red-100 text-red-800")}>Checked out to {borrowedBy ?? 'Unknown'}</span>
    default:
      return null
  }
}