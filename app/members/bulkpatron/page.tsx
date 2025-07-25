'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

type MemberRow = {
  name: string
  category: string
  barcode: string
  batch: string
}

export default function BulkUploadMembers() {
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
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
      <Loading />
    )
  }

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
          (r) => r.name && r.category && r.barcode && r.batch
        )

        if (cleaned.length === 0) {
          setMessage('❌ No valid rows found.')
          setUploading(false)
          return
        }

        try {
          const response = await fetch('/api/bulk-create-members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleaned),
          })

          const result = await response.json()

          if (!result.success) {
            setMessage(`❌ Failed to upload: ${result.error || 'Unknown error'}`)
          } else {
            setMessage(`✅ ${result.addedCount} members added. ${result.failed.length} failed.`)
            if (result.failed.length > 0) {
              console.warn('Failures:', result.failed)
            }
          }
        } catch (err) {
          console.error('Bulk upload error:', err)
          setMessage('❌ Something went wrong.')
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
    <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-lg mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey space-y-6">
        <h1 className="text-3xl font-bold text-center text-heading-text-black">
          📥 Bulk Upload Members
        </h1>

        <div className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-button-yellow file:text-button-text-black file:font-semibold file:cursor-pointer bg-secondary-white text-text-grey placeholder-text-grey rounded-lg border border-primary-dark-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          />

          {uploading && (
            <p className="text-blue-600 font-medium">Uploading...</p>
          )}

          {message && (
            <p className="text-green-600 font-medium">{message}</p>
          )}

          <div className="text-text-grey text-sm border-t border-primary-dark-grey pt-4 space-y-2">
            <p>📝 <strong>CSV must include:</strong></p>
            <code className="block bg-primary-grey p-2 rounded text-text-grey">
              name, category, barcode, batch
            </code>
            <p>📌 <strong>Example:</strong></p>
            <code className="block bg-primary-grey p-2 rounded text-text-grey">
              Shuhaib, student, U445, 12th Batch
            </code>
          </div>
        </div>
      </div>
    </main>
  )
}
