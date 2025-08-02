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
    const confirmed = window.confirm('Are you sure you want to mark this fine as paid?')
    if (!confirmed) return
    
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
    <div className="min-h-screen bg-primary-grey pt-24 px-4">
      <div
        className="max-w-6xl mx-auto backdrop-blur-md bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10"
      >
        <h1 className="text-3xl uppercase md:text-4xl font-bold font-heading mb-6 text-heading-text-black text-center">
          Unpaid Fines
        </h1>

        {loading ? (
          <Loading />
        ) : fines.length === 0 ? (
          <p className="text-text-grey text-center">🎉 No unpaid fines</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm text-left text-text-grey">
              <thead className="bg-secondary-light-black backdrop-blur border-b border-primary-dark-grey">
                <tr className='text-white uppercase'>
                  <th className="p-3 border">Member</th>
                  <th className="p-3 border">Book</th>
                  <th className="p-3 border">Fine</th>
                  <th className="p-3 border">Returned On</th>
                  <th className="p-3 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t border-primary-dark-grey hover:bg-primary-dark-grey transition"
                  >
                    <td className="p-3 border">{f.member?.name}</td>
                    <td className="p-3 border font-malayalam">{f.book?.title}</td>
                    <td className="p-3 border">₹{f.fine}</td>
                    <td className="p-3 border">
                      {f.return_date ? new Date(f.return_date).toLocaleDateString() : 'Not returned'}
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => markAsPaid(f.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      >
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
