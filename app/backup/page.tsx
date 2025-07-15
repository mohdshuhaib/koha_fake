'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [backupData, setBackupData] = useState<any[]>([])
  const [message, setMessage] = useState('')

  const fetchAndDownloadBackup = async () => {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('borrow_records')
      .select(`
        id,
        borrow_date,
        due_date,
        return_date,
        members(name, batch),
        books(title),
        member_id,
        book_id
      `)

    if (error || !data) {
      setMessage('❌ Failed to fetch data')
      setLoading(false)
      return
    }

    const normalized = data.map((r: any) => ({
      id: r.id,
      borrow_date: r.borrow_date,
      due_date: r.due_date,
      return_date: r.return_date,
      member_name: Array.isArray(r.members) ? r.members[0]?.name : r.members?.name,
      book_title: Array.isArray(r.books) ? r.books[0]?.title : r.books?.title,
    }))

    const memberCounts: Record<string, { name: string; count: number }> = {}
    data.forEach((r: any) => {
      const name = Array.isArray(r.members) ? r.members[0]?.name : r.members?.name
      if (!name) return
      memberCounts[r.member_id] = memberCounts[r.member_id] || { name, count: 0 }
      memberCounts[r.member_id].count++
    })

    const topMembers = Object.values(memberCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const bookCounts: Record<string, { name: string; count: number }> = {}
    data.forEach((r: any) => {
      const title = Array.isArray(r.books) ? r.books[0]?.title : r.books?.title
      if (!title) return
      bookCounts[r.book_id] = bookCounts[r.book_id] || { name: title, count: 0 }
      bookCounts[r.book_id].count++
    })

    const topBooks = Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Count top batches
    const batchCounts: Record<string, { batch: string; count: number }> = {}
    data.forEach((r: any) => {
      const batch = Array.isArray(r.members) ? r.members[0]?.batch : r.members?.batch
      if (!batch) return
      batchCounts[batch] = batchCounts[batch] || { batch, count: 0 }
      batchCounts[batch].count++
    })

    const topBatches = Object.values(batchCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const csv = convertToCSVWithSummary(normalized, topMembers, topBooks, topBatches)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `borrow_records_backup_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setBackupData(normalized)
    setMessage('✅ Backup with summary downloaded successfully.')
    setLoading(false)
  }

  const convertToCSVWithSummary = (
    records: any[],
    topMembers: { name: string; count: number }[],
    topBooks: { name: string; count: number }[],
    topBatches: { batch: string; count: number }[]
  ) => {
    const keys = Object.keys(records[0] || {})
    const rows = records.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
    const csvMain = [keys.join(','), ...rows].join('\n')

    const memberSection = [
      '\n\nTop 5 Members,',
      'Rank,Name,Times Borrowed',
      ...topMembers.map((m, i) => `${i + 1},"${m.name}",${m.count}`)
    ].join('\n')

    const bookSection = [
      '\n\nTop 5 Books,',
      'Rank,Title,Times Borrowed',
      ...topBooks.map((b, i) => `${i + 1},"${b.name}",${b.count}`)
    ].join('\n')

    const batchSection = [
      '\n\nTop 5 Batches,',
      'Rank,Batch,Times Borrowed',
      ...topBatches.map((b, i) => `${i + 1},"${b.batch}",${b.count}`)
    ].join('\n')

    return `${csvMain}${memberSection}${bookSection}${batchSection}`

  }

  const deleteAllRecords = async () => {
    const confirmDelete = window.confirm('⚠ Are you sure you want to delete all borrow records? This action cannot be undone!')
    if (!confirmDelete) return

    setLoading(true)
    setMessage('')

    const { data: records, error: fetchError } = await supabase
      .from('borrow_records')
      .select('id')

    if (fetchError) {
      console.error(fetchError)
      setMessage('❌ Failed to fetch borrow record IDs')
      setLoading(false)
      return
    }

    const recordIds = records?.map(r => r.id)
    if (!recordIds.length) {
      setMessage('⚠ No records to delete.')
      setLoading(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('borrow_records')
      .delete()
      .in('id', recordIds)

    if (deleteError) {
      console.error(deleteError)
      setMessage('❌ Failed to delete records')
    } else {
      setMessage('🗑️ All borrow records deleted')
      setBackupData([])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4">
      <div
        className="max-w-xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10 space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-heading-text-black mb-6">📦 Backup & Delete Records</h1>

        <div className="space-y-4">
          <button
            onClick={fetchAndDownloadBackup}
            disabled={loading}
            className="w-full bg-button-yellow hover:bg-primary-dark-grey transition text-button-text-black font-semibold py-3 px-4 rounded-lg shadow"
          >
            ⬇️ Download Backup
          </button>

          {backupData.length > 0 && (
            <button
              onClick={deleteAllRecords}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 transition text-white font-semibold py-3 px-4 rounded-lg shadow"
            >
              🗑️ Delete All Borrow Records
            </button>
          )}

          {message && (
            <p className="text-center text-sm text-text-grey mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
