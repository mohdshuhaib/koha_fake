'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'

type MemberRow = {
  name: string
  email: string
  dob: string
  category: string
}

export default function BulkUploadMembers() {
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('Reading file...')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows: MemberRow[] = results.data as MemberRow[]

        const cleaned = rows.filter(
          (r) => r.name && r.email && r.dob && r.category
        )

        if (cleaned.length === 0) {
          setMessage('❌ No valid rows found.')
          setUploading(false)
          return
        }

        const { error } = await supabase.from('members').insert(cleaned)

        if (error) {
          console.error('❌ Supabase Insert Error:', error)
          setMessage(`❌ Failed to upload: ${error.message}`)
        } else {
          setMessage(`✅ Uploaded ${cleaned.length} members successfully!`)
        }

        setUploading(false)
      },
      error: (err) => {
        console.error('CSV parse error:', err)
        setMessage('❌ Failed to read file.')
        setUploading(false)
      },
    })
  }

  return (
    <div className="max-w-md p-4 border rounded shadow">
      <h2 className="text-xl font-semibold mb-2">📥 Bulk Upload Members</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-2"
      />
      {uploading && <p className="text-blue-600">Uploading...</p>}
      {message && <p className="text-sm text-gray-700">{message}</p>}
      <p className="text-xs mt-2 text-gray-500">
        CSV must include: <code>name, email, dob, category</code>
      </p>
    </div>
  )
}
