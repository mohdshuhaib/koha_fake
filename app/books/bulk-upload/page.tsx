'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

export default function BulkUploadPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userload, setuserload] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }

      setCheckingSession(false)
      setuserload(false)
    }

    checkAuth()
  }, [router])

  if (userload) {
    return (
      <Loading/>
    )
  }

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
        language: row.language || '',
        shelf_location: row.shelf_location || '',
        call_number: row.call_number || '',
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
     <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-xl mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey">
        <h1 className="text-3xl uppercase font-heading font-bold text-center mb-6 text-heading-text-black">
          Bulk Upload Books (.xlsx)
        </h1>

        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="w-full p-3 bg-secondary-white border border-primary-dark-grey rounded-lg text-text-grey placeholder-text-grey file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-button-yellow file:text-button-text-black file:font-semibold hover:file:bg-primary-dark-grey transition"
        />

        {loading && <p className="mt-4 text-link-text-green">Uploading...</p>}
        {message && (
          <p className={`mt-4 text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <p className="text-xs mt-6 text-text-grey">
          Make sure your Excel file includes the columns: <code>title, author, language, shelf_location, call_number, barcode, status</code><br />
          <code>Example:</code><br />
          <code>Book Title, Author Name, MAL, 77, 823.9/KMK, 123, available</code>
        </p>
      </div>
    </main>
  )
}
