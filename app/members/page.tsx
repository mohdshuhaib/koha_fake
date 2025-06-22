'use client'

import MemberTable from '@/components/MemberTable'
import Link from 'next/link'

export default function MemberPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Patron Management</h1>

      <div className="space-y-4">
        <Link
          href="members/addpatron"
          className="block px-4 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          ➕ Add Single Patron
        </Link>

        <Link
          href="members/bulkpatron"
          className="block px-4 py-3 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
        >
          📦 Bulk Upload Patron
        </Link>
      </div>
      <MemberTable/>
    </div>
  )
}
