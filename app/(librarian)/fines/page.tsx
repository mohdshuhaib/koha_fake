'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'

export default function FinesPage() {
  const [loading, setLoading] = useState(true)
  const [fines, setFines] = useState<any[]>([])
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
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchFines = async () => {
      if (!isLoggedIn) return

      const { data, error } = await supabase
        .from('borrow_records')
        .select('id, fine, return_date, fine_paid, member:member_id(name), book:book_id(title)')
        .eq('fine_paid', false)
        .gt('fine', 0)

      if (error) {
        console.error(error)
      } else {
        setFines(data)
      }

      setLoading(false)
    }

    fetchFines()
  }, [isLoggedIn])

  const markAsPaid = async (id: number) => {
    const { error } = await supabase
      .from('borrow_records')
      .update({ fine_paid: true })
      .eq('id', id)

    if (!error) {
      setFines((prev) => prev.filter((f) => f.id !== id))
    } else {
      alert('❌ Failed to mark as paid')
    }
  }

  if (checkingSession) {
    return <Loading/>
  }

  if (!isLoggedIn) return null

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">💰 Unpaid Fines</h1>

      {loading ? (
        <Loading/>
      ) : fines.length === 0 ? (
        <p>🎉 No unpaid fines</p>
      ) : (
        <table className="w-full border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Member</th>
              <th className="p-2 border">Book</th>
              <th className="p-2 border">Fine</th>
              <th className="p-2 border">Returned On</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((f) => (
              <tr key={f.id}>
                <td className="p-2 border">{f.member?.name}</td>
                <td className="p-2 border">{f.book?.title}</td>
                <td className="p-2 border">₹{f.fine}</td>
                <td className="p-2 border">{f.return_date ? new Date(f.return_date).toLocaleDateString() : 'Not returned'}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => markAsPaid(f.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Mark as Paid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
