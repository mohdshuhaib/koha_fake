'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '../loading'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBooks: 0,
    malBooks: 0,
    engBooks: 0,
    urdBooks: 0,
    arbBooks: 0,
    totalMembers: 0,
    borrowedNow: 0,
    pendingFines: 0,
  })
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.replace('/login')
        return
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      // Fetch stats and recent history
      const [
        { count: books },
        { count: members },
        { count: borrowed },
        { data: fines },
        { data: dueToday },
        { count: malBooks },
        { count: engBooks },
        { count: urdBooks },
        { count: arbBooks },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('borrow_records').select('*', { count: 'exact', head: true }).is('return_date', null),
        supabase.from('borrow_records').select('fine').eq('fine_paid', false).gt('fine', 0),
        supabase
          .from('borrow_records')
          .select(`
            id,
            return_date,
            created_at,
            book:book_id ( title, barcode ),
            member:member_id ( name )
          `)
          .eq('return_date', null)
          .eq('due_date', today),

        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'MAL'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'ENG'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'URD'),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('language', 'ARB'),
      ])

      const pendingFinesTotal = fines?.reduce((sum, r) => sum + (r.fine || 0), 0)

      setStats({
        totalBooks: books || 0,
        malBooks: malBooks || 0,
        engBooks: engBooks || 0,
        urdBooks: urdBooks || 0,
        arbBooks: arbBooks || 0,
        totalMembers: members || 0,
        borrowedNow: borrowed || 0,
        pendingFines: pendingFinesTotal || 0,
      })

      setHistory(dueToday || [])
      setLoading(false)
    }

    checkAuthAndFetchStats()
  }, [router])

  const languageBreakdown = [
    { label: 'Malayalam', count: stats.malBooks, color: 'bg-yellow-400' },
    { label: 'English', count: stats.engBooks, color: 'bg-blue-500' },
    { label: 'Urdu', count: stats.urdBooks, color: 'bg-red-500' },
    { label: 'Arabic', count: stats.arbBooks, color: 'bg-green-500' },
  ]

  if (loading) return <Loading />

  return (
    <main className="pt-32 min-h-screen bg-primary-grey px-4 pb-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1
          className="text-3xl font-bold text-heading-text-black"
        >
          📊 Library Dashboard
        </h1>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div
            className="bg-secondary-white rounded-xl p-6 shadow-lg"
          >
            <p className="text-sm text-heading-text-black mb-2 font-medium">📚 Total Books</p>
            <p className="text-3xl font-bold text-heading-text-black mb-4">{stats.totalBooks}</p>
            <div className="space-y-2">
              {languageBreakdown.map(({ label, count, color }) => {
                const percent = stats.totalBooks ? (count / stats.totalBooks) * 100 : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm text-heading-text-black">
                      <span>{label}</span>
                      <span>{count}</span>
                    </div>
                    <div className="w-full bg-primary-dark-grey h-2 rounded">
                      <div
                        className={`${color} h-2 rounded`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="🙍‍♂️ Members" value={stats.totalMembers} />
            <StatCard label="📕 Borrowed Now" value={stats.borrowedNow} />
            <StatCard label="💰 Pending Fines" value={`₹${stats.pendingFines}`} />
          </div>
        </div>

        <div
          className="bg-secondary-white backdrop-blur p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">📅 Books Due for Return Today</h2>
          {history.length === 0 ? (
            <p className="text-black">No books due for return today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-primary-dark-grey">
                <thead className="text-white border-b border-primary-dark-grey backdrop-blur-sm bg-secondary-light-black">
                  <tr>
                    <th className="p-3 border-b border-primary-dark-grey text-left">Barcode</th>
                    <th className="p-3 border-b border-primary-dark-grey text-left">Book</th>
                    <th className="p-3 border-b border-primary-dark-grey text-left">Member</th>
                    <th className="p-3 border-b border-primary-dark-grey text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-t border-primary-dark-grey hover:bg-primary-dark-grey">
                      <td className="p-3">{r.book?.barcode || '—'}</td>
                      <td className="p-3">{r.book?.title || 'Unknown Book'}</td>
                      <td className="p-3">{r.member?.name || 'Unknown Member'}</td>
                      <td className="p-3">
                        {r.return_date ? (
                          <span className="text-green-600">Checked In</span>
                        ) : (
                          <span className="text-yellow-600">Checked Out</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="bg-secondary-white rounded-xl p-6 text-center shadow-lg"
    >
      <p className="text-sm text-heading-text-black mb-1 font-medium">{label}</p>
      <p className="text-2xl font-bold text-heading-text-black">{value}</p>
    </div>
  )
}
