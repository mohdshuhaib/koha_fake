'use client'

import Link from 'next/link'

export default function BooksHomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📚 Book Management</h1>

      <div className="space-y-4">
        <Link
          href="books/add"
          className="block px-4 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          ➕ Add Single Book
        </Link>

        <Link
          href="books/bulk-upload"
          className="block px-4 py-3 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
        >
          📦 Bulk Upload Books
        </Link>
      </div>
    </div>
  )
}
