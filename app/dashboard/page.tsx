'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    borrowedNow: 0,
    pendingFines: 0,
  })

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.replace('/login')
        return
      }

      // Authenticated: fetch stats
      const [
        { count: books },
        { count: members },
        { count: borrowed },
        { data: fines },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase
          .from('borrow_records')
          .select('*', { count: 'exact', head: true })
          .is('return_date', null),
        supabase
          .from('borrow_records')
          .select('fine')
          .eq('fine_paid', false)
          .gt('fine', 0),
      ])

      const pendingFinesTotal = fines?.reduce((sum, r) => sum + (r.fine || 0), 0)

      setStats({
        totalBooks: books || 0,
        totalMembers: members || 0,
        borrowedNow: borrowed || 0,
        pendingFines: pendingFinesTotal || 0,
      })

      setLoading(false)
    }

    checkAuthAndFetchStats()
  }, [router])

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📊 Library Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="📚 Books" value={stats.totalBooks} />
        <StatCard label="👤 Members" value={stats.totalMembers} />
        <StatCard label="📕 Borrowed Now" value={stats.borrowedNow} />
        <StatCard label="💰 Pending Fines" value={`₹${stats.pendingFines}`} />
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
