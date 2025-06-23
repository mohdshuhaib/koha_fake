'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MemberDashboard() {
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/member-login')
        return
      }

      const barcode = user.email?.split('@')[0] || ''

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('barcode', barcode)
        .single()

      if (memberError || !memberData) {
        setError('Member not found.')
        setLoading(false)
        return
      }

      const { data: records, error: recordsError } = await supabase
        .from('borrow_records')
        .select(`
          *,
          books (
            title
          )
        `)
        .eq('member_id', memberData.id)
        .order('borrow_date', { ascending: false })

      if (recordsError) {
        setError('Could not fetch borrowing records.')
        setLoading(false)
        return
      }

      const booksRead = records?.filter((r) => r.return_date !== null).length || 0
      const pendingFines = records?.reduce(
        (acc, r) => acc + (r.fine_paid ? 0 : r.fine || 0),
        0
      ) || 0

      setMember({
        name: memberData.name,
        booksRead,
        pendingFines,
        history: records || [],
      })

      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {member.name}</h1>
          <button
            onClick={() => {
              supabase.auth.signOut()
              router.push('/member-login')
            }}
            className="text-sm bg-red-500 px-3 py-1.5 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sidekick-dark p-4 rounded-lg shadow">
            <p className="text-lg font-semibold">📖 Books Read</p>
            <p className="text-3xl font-bold">{member.booksRead}</p>

          </div>
          <div className="bg-sidekick-dark p-4 rounded-lg shadow">
            <p className="text-lg font-semibold">💸 Pending Fines</p>
            <p className="text-3xl font-bold">₹{member.pendingFines}</p>
          </div>
        </div>

        <div className="bg-white text-black rounded-lg p-4 shadow">
          <h2 className="text-xl font-bold mb-2">📖 Borrowing History</h2>
          <ul className="space-y-2 text-sm">
            {member.history.length === 0 && (
              <li className="text-gray-500">No borrowing history found.</li>
            )}
            {member.history.map((record: any, index: number) => (
              <li key={index} className="border-b pb-2">
                <p><strong>Book:</strong> {record.books?.title || 'Unknown Title'}</p>
                <p><strong>Borrowed:</strong> {new Date(record.borrow_date).toLocaleDateString()}</p>
                <p><strong>Due:</strong> {new Date(record.due_date).toLocaleDateString()}</p>
                <p><strong>Returned:</strong> {record.return_date ? new Date(record.return_date).toLocaleDateString() : 'Not returned yet'}</p>
                {record.fine > 0 && (
                  <p className={record.fine_paid ? 'text-green-600' : 'text-red-600'}>
                    Fine: ₹{record.fine} {record.fine_paid ? '(Paid)' : '(Unpaid)'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
