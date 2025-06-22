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

      // Authenticated: fetch stats and recent history
      const [
        { count: books },
        { count: members },
        { count: borrowed },
        { data: fines },
        { data: recent }
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
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const pendingFinesTotal = fines?.reduce((sum, r) => sum + (r.fine || 0), 0)

      setStats({
        totalBooks: books || 0,
        totalMembers: members || 0,
        borrowedNow: borrowed || 0,
        pendingFines: pendingFinesTotal || 0,
      })

      setHistory(recent || [])
      setLoading(false)
    }

    checkAuthAndFetchStats()
  }, [router])

  if (loading) return <Loading />

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">📊 Library Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="📚 Books" value={stats.totalBooks} />
        <StatCard label="👤 Members" value={stats.totalMembers} />
        <StatCard label="📕 Borrowed Now" value={stats.borrowedNow} />
        <StatCard label="💰 Pending Fines" value={`₹${stats.pendingFines}`} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-4">🕘 Recent Check In / Out</h2>
        {history.length === 0 ? (
          <p>No recent activity</p>
        ) : (
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 border">Barcode</th>
                <th className="p-2 border">Book</th>
                <th className="p-2 border">Member</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.book?.barcode || '—'}</td>
                  <td className="p-2 border">{r.book?.title || 'Unknown Book'}</td>
                  <td className="p-2 border">{r.member?.name || 'Unknown Member'}</td>
                  <td className="p-2 border">
                    {r.return_date ? (
                      <span className="text-green-600">Checked In</span>
                    ) : (
                      <span className="text-orange-600">Checked Out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white shadow rounded p-4 text-center border">
      <h2 className="text-sm text-gray-500 mb-1">{label}</h2>
      <p className="text-xl font-bold text-blue-600">{value}</p>
    </div>
  )
}
