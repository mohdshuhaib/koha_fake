'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'

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
        .eq('barcode', barcode.toUpperCase())
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

  if (loading) return <Loading/>
  if (error) return <div className="p-8 pt-14 text-center text-red-500">{error}</div>

  return (
    <div className="pt-32 min-h-screen bg-primary-grey px-4 pb-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div
          className="flex justify-between items-center"
        >
          <h1 className="text-3xl font-bold text-heading-text-black font-heading">Welcome, {member.name}</h1>
          <button
            onClick={() => {
              supabase.auth.signOut()
              router.push('/')
            }}
            className="text-sm bg-red-600 text-white font-bold px-4 py-2 rounded-full hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <div className="bg-secondary-white p-6 rounded-xl shadow-lg">
            <p className="text-lg font-medium text-heading-text-black">📖 Books Read</p>
            <p className="text-4xl font-bold text-heading-text-black mt-2">{member.booksRead}</p>
          </div>
          <div className="bg-secondary-white p-6 rounded-xl shadow-lg">
            <p className="text-lg font-medium text-heading-text-black">💸 Pending Fines</p>
            <p className="text-4xl font-bold text-heading-text-black mt-2">₹{member.pendingFines}</p>
          </div>
        </div>

        <div
          className="bg-secondary-white rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4 text-heading-text-black">📚 Borrowing History</h2>
          <ul className="space-y-4 text-sm">
            {member.history.length === 0 && (
              <li className="text-text-grey">No borrowing history found.</li>
            )}
            {member.history.map((record: any, index: number) => (
              <li
                key={index}
                className="border-b border-primary-dark-grey pb-3 space-y-1"
              >
                <p className='text-text-grey'><strong className='text-heading-text-black font-malayalam'>📘 Book:</strong> {record.books?.title || 'Unknown Title'}</p>
                <p className='text-text-grey'><strong className='text-heading-text-black'>📅 Borrowed:</strong> {new Date(record.borrow_date).toLocaleDateString()}</p>
                <p className='text-text-grey'><strong className='text-heading-text-black'>📆 Due:</strong> {new Date(record.due_date).toLocaleDateString()}</p>
                <p className='text-text-grey'><strong className='text-heading-text-black'>✅ Returned:</strong> {record.return_date ? new Date(record.return_date).toLocaleDateString() : 'Not returned yet'}</p>
                {record.fine > 0 && (
                  <p className={record.fine_paid ? 'text-green-600' : 'text-red-600'}>
                    💰 Fine: ₹{record.fine} {record.fine_paid ? '(Paid)' : '(Unpaid)'}
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
