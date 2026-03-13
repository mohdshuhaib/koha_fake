'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Star,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import clsx from 'classnames'
import * as XLSX from 'xlsx'

type BookReview = {
  id: string
  reviewer_name: string
  reviewer_role: string | null
  comment: string | null
  rating: number
  created_at: string
  approved?: boolean
}

type Book = {
  id: string
  barcode: string
  title: string
  author: string | null
  language: 'MAL' | 'ENG' | 'ARB' | 'URD' | string | null
  call_number: string | null
  shelf_location: string | null
  pages: number | null
  status: 'available' | 'borrowed' | 'held'
  borrow_records?: {
    return_date: string | null
    members: {
      name: string
    } | null
  }[]
  hold_records?: {
    released: boolean
    hold_date: string
    member: {
      name: string
    } | null
  }[]
  book_reviews?: BookReview[]
}

type ReviewFormState = {
  reviewer_name: string
  reviewer_role: string
  comment: string
  rating: number
}

const PAGE_SIZE = 20

const LANGUAGE_OPTIONS = [
  { label: 'All Languages', value: 'ALL' },
  { label: 'Malayalam', value: 'MAL' },
  { label: 'English', value: 'ENG' },
  { label: 'Arabic', value: 'ARB' },
  { label: 'Urdu', value: 'URD' },
]

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Available', value: 'available' },
  { label: 'Checked Out', value: 'borrowed' },
  { label: 'Held', value: 'held' },
]

const SORT_OPTIONS = [
  { label: 'Barcode (Default)', value: 'barcode' },
  { label: 'Top Rated', value: 'top_rated' },
  { label: 'Most Reviewed', value: 'most_reviewed' },
  { label: 'Title A-Z', value: 'title_asc' },
]

const CATALOG_LINKS = [
  { label: 'Malayalam Books Catalogue', url: 'https://docs.google.com/spreadsheets/d/1jiRgNlI2KA3izFDlCtU2QsgA16TTHWGg/edit?usp=sharing&ouid=117568178670405218141&rtpof=true&sd=true' },
  { label: 'English Books Catalogue', url: 'https://docs.google.com/spreadsheets/d/1f-m278RZ6ImPeFVrdtd1bGBmnOPjRibs/edit?usp=sharing&ouid=117568178670405218141&rtpof=true&sd=true' },
  { label: 'Arabic Books Catalogue', url: 'https://docs.google.com/spreadsheets/d/1tQnq5l_IKPhWNuFOwtBhR7NzU-lPG2Cv/edit?usp=sharing&ouid=117568178670405218141&rtpof=true&sd=true' },
  { label: 'Urdu Books Catalogue', url: 'https://docs.google.com/spreadsheets/d/1-3RcD-qkBRKWW-bwXZ4fJppow9Q4Cw13/edit?usp=sharing&ouid=117568178670405218141&rtpof=true&sd=true' },
]

function getLanguageName(code: string | null | undefined) {
  switch (code) {
    case 'MAL':
      return 'Malayalam'
    case 'ENG':
      return 'English'
    case 'ARB':
      return 'Arabic'
    case 'URD':
      return 'Urdu'
    default:
      return code || '-'
  }
}

function getReviewStats(reviews?: BookReview[]) {
  const approvedReviews = (reviews || []).filter((r) => r.approved !== false)
  const count = approvedReviews.length
  const average =
    count > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0

  return {
    count,
    average,
    roundedAverage: Number(average.toFixed(1)),
  }
}

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [languageFilter, setLanguageFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('barcode')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isCatalogueDropdownOpen, setIsCatalogueDropdownOpen] = useState(false)

  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    reviewer_name: '',
    reviewer_role: '',
    comment: '',
    rating: 0,
  })

  const fetchBooks = async () => {
    setLoading(true)

    let query = supabase
      .from('books')
      .select(`
        *,
        borrow_records(return_date, members(name)),
        hold_records(released, hold_date, member:members(name)),
        book_reviews(id, reviewer_name, reviewer_role, comment, rating, created_at, approved)
      `)

    if (search.trim()) {
      const searchText = `%${search.trim()}%`
      query = query.or(
        `title.ilike.${searchText},author.ilike.${searchText},language.ilike.${searchText},call_number.ilike.${searchText},barcode.ilike.${searchText},shelf_location.ilike.${searchText}`
      )
    }

    if (languageFilter !== 'ALL') {
      query = query.eq('language', languageFilter)
    }

    if (statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Catalog fetch error:', error)
      setBooks([])
    } else {
      setBooks((data as Book[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchBooks()
  }, [search, languageFilter, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, languageFilter, statusFilter, sortBy])

  const processedBooks = useMemo(() => {
    const cloned = [...books]

    cloned.sort((a, b) => {
      const aStats = getReviewStats(a.book_reviews)
      const bStats = getReviewStats(b.book_reviews)

      switch (sortBy) {
        case 'top_rated': {
          if (bStats.average !== aStats.average) {
            return bStats.average - aStats.average
          }
          if (bStats.count !== aStats.count) {
            return bStats.count - aStats.count
          }
          return (a.title || '').localeCompare(b.title || '')
        }

        case 'most_reviewed': {
          if (bStats.count !== aStats.count) {
            return bStats.count - aStats.count
          }
          if (bStats.average !== aStats.average) {
            return bStats.average - aStats.average
          }
          return (a.title || '').localeCompare(b.title || '')
        }

        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '')

        case 'barcode':
        default:
          return (a.barcode || '').localeCompare(b.barcode || '')
      }
    })

    return cloned
  }, [books, sortBy])

  const totalBooks = processedBooks.length
  const totalPages = Math.ceil(totalBooks / PAGE_SIZE) || 1

  const paginatedBooks = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE
    return processedBooks.slice(from, to)
  }, [processedBooks, page])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const { data: allBooks, error } = await supabase
        .from('books')
        .select('title, author, barcode, language, call_number, shelf_location, pages, status')
        .order('language')
        .order('title')

      if (error || !allBooks) {
        throw new Error('Failed to fetch books for export.')
      }

      const booksByLanguage = allBooks.reduce((acc, book) => {
        const lang = getLanguageName(book.language) || 'Unknown'
        if (!acc[lang]) acc[lang] = []

        const { language, ...bookData } = book
        acc[lang].push(bookData)
        return acc
      }, {} as Record<string, any[]>)

      const workbook = XLSX.utils.book_new()

      for (const language in booksByLanguage) {
        const worksheet = XLSX.utils.json_to_sheet(booksByLanguage[language])
        XLSX.utils.book_append_sheet(workbook, worksheet, language.slice(0, 31))
      }

      XLSX.writeFile(workbook, 'library_catalog_by_language.xlsx')
    } catch (err) {
      console.error('Export failed:', err)
      alert('Could not export the catalog. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const resetReviewForm = () => {
    setReviewForm({
      reviewer_name: '',
      reviewer_role: '',
      comment: '',
      rating: 0,
    })
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBook) return

    if (!reviewForm.reviewer_name.trim()) {
      alert('Please enter your name.')
      return
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert('Please select a rating.')
      return
    }

    setIsSubmittingReview(true)

    const { error } = await supabase.from('book_reviews').insert({
      book_id: selectedBook.id,
      reviewer_name: reviewForm.reviewer_name.trim(),
      reviewer_role: reviewForm.reviewer_role.trim() || null,
      comment: reviewForm.comment.trim() || null,
      rating: reviewForm.rating,
    })

    setIsSubmittingReview(false)

    if (error) {
      console.error('Review insert error:', error)
      alert('Could not submit review. Please try again.')
      return
    }

    alert('Review submitted successfully.')
    setSelectedBook(null)
    resetReviewForm()
    fetchBooks()
  }

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4 font-body">
      <div className="max-w-7xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-heading-text-black font-heading uppercase tracking-wider">
              Book Catalog
            </h1>
            <p className="text-sm text-text-grey mt-2">
              Public catalog for browsing books, checking status, and sharing reviews.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <button
                onClick={() => setIsCatalogueDropdownOpen((prev) => !prev)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
              >
                <ExternalLink size={16} />
                Open Language Catalogues
                <ChevronDown size={16} />
              </button>

              {isCatalogueDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-primary-dark-grey rounded-xl shadow-xl z-20 overflow-hidden">
                  {CATALOG_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 text-sm text-heading-text-black hover:bg-primary-grey transition"
                    >
                      <span>{item.label}</span>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-wait"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export Catalog'}
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-text-grey" />
          </div>
          <input
            type="text"
            placeholder="Search by title, author, language, call number, barcode, shelf"
            className="w-full p-3 pl-12 rounded-lg bg-secondary-white border border-dark-green text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <FilterSelect
            label="Language"
            value={languageFilter}
            onChange={setLanguageFilter}
            options={LANGUAGE_OPTIONS}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />

          <div className="rounded-xl border border-primary-dark-grey bg-primary-grey px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary-light-black text-white">
              <Filter size={16} />
            </div>
            <div>
              <p className="text-xs text-text-grey uppercase tracking-wide">Results</p>
              <p className="text-base font-semibold text-heading-text-black">{totalBooks} books found</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16">
            <Loading />
          </div>
        ) : paginatedBooks.length === 0 ? (
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
                    {paginatedBooks.map((book) => {
                      const activeBorrow = book.borrow_records?.find((br) => br.return_date === null)
                      const borrowedBy = activeBorrow?.members?.name
                      const activeHold = book.hold_records?.find((hr) => !hr.released)
                      const heldBy = activeHold?.member?.name
                      const stats = getReviewStats(book.book_reviews)

                      return (
                        <>
                          <tr
                            key={book.id}
                            onClick={() => setSelectedBook(book)}
                            className="border-b border-primary-dark-grey hover:bg-primary-grey transition-colors cursor-pointer"
                            title="Click to review this book"
                          >
                            <td className="px-4 py-3 align-middle text-text-grey">{book.barcode}</td>
                            <td className="px-4 py-3 align-middle">
                              <div className="font-malayalam font-semibold text-heading-text-black">
                                {book.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-text-grey">
                                <span className="inline-flex items-center gap-1">
                                  <Star size={12} className="fill-current" />
                                  {stats.count > 0 ? `${stats.roundedAverage}/5` : 'No ratings yet'}
                                </span>
                                <span>•</span>
                                <span>{stats.count} review{stats.count === 1 ? '' : 's'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle font-malayalam text-text-grey">
                              {book.author || '-'}
                            </td>
                            <td className="px-4 py-3 align-middle text-text-grey">
                              {getLanguageName(book.language)}
                            </td>
                            <td className="px-4 py-3 align-middle text-text-grey font-semibold">
                              {book.pages ?? '-'}
                            </td>
                            <td className="px-4 py-3 align-middle text-text-grey">{book.call_number || '-'}</td>
                            <td className="px-4 py-3 align-middle text-text-grey">{book.shelf_location || '-'}</td>
                            <td className="px-4 py-3 align-middle">
                              <StatusBadge status={book.status} heldBy={heldBy} borrowedBy={borrowedBy} />
                            </td>
                          </tr>

                          <tr className="border-b border-primary-dark-grey bg-[#fafafa]">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="flex items-center gap-3 text-sm text-text-grey">
                                  <span className="inline-flex items-center gap-1 font-semibold text-yellow-700">
                                    <Star size={14} className="fill-current" />
                                    {stats.count > 0 ? `${stats.roundedAverage} / 5` : 'No rating'}
                                  </span>
                                  <span>
                                    based on {stats.count} review{stats.count === 1 ? '' : 's'}
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedBook(book)
                                  }}
                                  className="w-full md:w-auto px-4 py-2 rounded-lg bg-button-yellow text-button-text-black font-semibold hover:bg-yellow-500 transition"
                                >
                                  Write a Review
                                </button>
                              </div>

                              {book.book_reviews && book.book_reviews.filter((r) => r.approved !== false).length > 0 && (
                                <div className="mt-3 grid gap-2">
                                  {book.book_reviews
                                    .filter((r) => r.approved !== false)
                                    .slice(0, 2)
                                    .map((review) => (
                                      <div
                                        key={review.id}
                                        className="rounded-lg border border-primary-dark-grey bg-white px-3 py-2"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                          <div className="font-semibold text-heading-text-black">
                                            {review.reviewer_name}
                                            {review.reviewer_role ? ` • ${review.reviewer_role}` : ''}
                                          </div>
                                          <div className="flex items-center gap-1 text-yellow-700 font-semibold">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                              <Star
                                                key={i}
                                                size={14}
                                                className={clsx(
                                                  i < review.rating ? 'fill-current text-yellow-500' : 'text-gray-300'
                                                )}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                        {review.comment && (
                                          <p className="text-sm text-text-grey mt-1">{review.comment}</p>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        </>
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

      {selectedBook && (
        <ReviewModal
          book={selectedBook}
          form={reviewForm}
          setForm={setReviewForm}
          onClose={() => {
            setSelectedBook(null)
            resetReviewForm()
          }}
          onSubmit={handleReviewSubmit}
          submitting={isSubmittingReview}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="rounded-xl border border-primary-dark-grey bg-secondary-white px-4 py-3">
      <label className="block text-xs text-text-grey uppercase tracking-wide mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-heading-text-black font-medium focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ReviewModal({
  book,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
}: {
  book: Book
  form: ReviewFormState
  setForm: React.Dispatch<React.SetStateAction<ReviewFormState>>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-dark-grey">
          <div>
            <h2 className="text-xl font-bold text-heading-text-black">Review this Book</h2>
            <p className="text-sm text-text-grey mt-1">{book.title}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary-grey transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-heading-text-black mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={form.reviewer_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reviewer_name: e.target.value }))
                }
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey focus:outline-none focus:ring-2 focus:ring-dark-green"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-heading-text-black mb-2">
                Job / Student / Role
              </label>
              <input
                type="text"
                value={form.reviewer_role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reviewer_role: e.target.value }))
                }
                placeholder="Student / Teacher / Staff / etc"
                className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey focus:outline-none focus:ring-2 focus:ring-dark-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-heading-text-black mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const current = i + 1
                return (
                  <button
                    type="button"
                    key={current}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        rating: current,
                      }))
                    }
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={clsx(
                        form.rating >= current
                          ? 'fill-yellow-400 text-yellow-500'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                )
              })}
              <span className="text-sm text-text-grey ml-2">
                {form.rating > 0 ? `${form.rating} out of 5` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-heading-text-black mb-2">
              Comment
            </label>
            <textarea
              value={form.comment}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, comment: e.target.value }))
              }
              rows={5}
              placeholder="Write your opinion about this book..."
              className="w-full px-4 py-3 rounded-lg border border-primary-dark-grey focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-lg border border-primary-dark-grey font-semibold text-heading-text-black hover:bg-primary-grey transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-lg bg-dark-green text-white font-semibold hover:opacity-90 transition disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
  heldBy,
  borrowedBy,
}: {
  status: string
  heldBy?: string
  borrowedBy?: string
}) {
  const baseClasses = 'px-2.5 py-1 rounded-full text-xs font-bold'

  switch (status) {
    case 'available':
      return <span className={clsx(baseClasses, 'bg-green-100 text-green-800')}>Available</span>

    case 'held':
      return (
        <span className={clsx(baseClasses, 'bg-yellow-100 text-yellow-800')}>
          Held by {heldBy ?? 'Unknown'}
        </span>
      )

    case 'borrowed':
      return (
        <span className={clsx(baseClasses, 'bg-red-100 text-red-800')}>
          Checked out to {borrowedBy ?? 'Unknown'}
        </span>
      )

    default:
      return null
  }
}