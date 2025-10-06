'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import clsx from 'classnames'
import * as XLSX from 'xlsx' // Import the Excel library

// --- Type Definitions ---
type Book = {
  id: number
  barcode: string
  title: string
  author: string
  language: string
  call_number: string
  shelf_location: string
  pages: number | null // Added pages field
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
  const [isExporting, setIsExporting] = useState(false) // State for export button

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

  // --- NEW: Function to handle Excel Export ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
        // Fetch ALL books, not just the paginated ones
        const { data: allBooks, error } = await supabase
            .from('books')
            .select('title, author, barcode, language, call_number, shelf_location, pages')
            .order('language')
            .order('title');

        if (error || !allBooks) {
            throw new Error("Failed to fetch books for export.");
        }

        // Group books by language
        const booksByLanguage = allBooks.reduce((acc, book) => {
            const lang = book.language || 'Unknown';
            if (!acc[lang]) {
                acc[lang] = [];
            }
            // Exclude the language field from the row data itself
            const { language, ...bookData } = book;
            acc[lang].push(bookData);
            return acc;
        }, {} as Record<string, Omit<typeof allBooks[0], 'language'>[]>);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Create a sheet for each language
        for (const language in booksByLanguage) {
            const worksheet = XLSX.utils.json_to_sheet(booksByLanguage[language]);
            XLSX.utils.book_append_sheet(workbook, worksheet, language);
        }

        // Trigger the download
        XLSX.writeFile(workbook, 'library_catalog_by_language.xlsx');

    } catch (err) {
        console.error("Export failed:", err);
        alert("Could not export the catalog. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(totalBooks / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4 font-body">
      <div className="max-w-7xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-heading-text-black font-heading uppercase text-center md:text-left tracking-wider">
                Book Catalog
            </h1>
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-wait"
            >
                <Download size={16} />
                {isExporting ? 'Exporting...' : 'Export Catalog'}
            </button>
        </div>

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
                  <thead className="bg-secondary-light-black text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Barcode</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Author</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Language</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Pages</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Call Number</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Shelf</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => {
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
                          <td className="px-4 py-3 align-middle text-text-grey font-semibold">{book.pages ?? '-'}</td>
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
