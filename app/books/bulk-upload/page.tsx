'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export default function BulkUploadPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage('')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Validate and map
      const books = jsonData.map((row: any) => ({
        title: row.title || '',
        author: row.author || '',
        shelf_location: row.shelf_location || '',
        call_number: row.call_number || '',
        language: row.language || '',
        barcode: row.barcode?.toString() || '',
        status: row.status || 'available',
      }))

      const { error } = await supabase.from('books').insert(books)

      if (error) {
        setMessage(`❌ Upload failed: ${error.message}`)
      } else {
        setMessage('✅ Books uploaded successfully!')
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📘 Bulk Upload Books (.xlsx)</h1>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
        className="mb-4 block"
      />

      {loading && <p className="text-blue-500">Uploading...</p>}
      {message && <p className={message.includes('✅') ? 'text-green-600' : 'text-red-500'}>{message}</p>}
    </div>
  )
}
