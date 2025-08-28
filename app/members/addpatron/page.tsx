'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import clsx from 'classnames'

export default function AddMemberPage() {
  const [formData, setFormData] = useState({
    name: '',
    batch: '',
    barcode: '',
    category: '',
  })
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const router = useRouter()

  // --- Authentication Logic ---
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setLoading(true)

    // Simplified: Call Supabase directly from the client
    const { error } = await supabase.from('members').insert([formData])

    if (error) {
      setFeedback({ type: 'error', message: `Failed to add patron: ${error.message}` })
    } else {
      setFeedback({ type: 'success', message: `Successfully added "${formData.name}" to the library.` })
      // Reset form on success
      setFormData({ name: '', batch: '', barcode: '', category: '' })
    }
    setLoading(false)
  }

  if (loading && !isLoggedIn) return <Loading />
  if (!isLoggedIn) return null

  // --- REDESIGNED JSX ---
  return (
    <main className="min-h-screen pt-24 px-4 pb-10 bg-primary-grey">
      <div className="max-w-3xl mx-auto">
        <Link href="/members" className="flex items-center gap-2 text-text-grey font-semibold hover:text-heading-text-black transition mb-4">
          <ArrowLeft size={18} />
          Back to Patron Management
        </Link>
        <div className="bg-secondary-white p-6 md:p-8 rounded-2xl shadow-xl border border-primary-dark-grey">
          <h1 className="text-2xl font-bold mb-6 text-heading-text-black uppercase font-heading tracking-wider">
            Add a New Patron
          </h1>

          <form onSubmit={handleAddMember} className="space-y-5">
            {feedback && (
              <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <span className="font-medium">{feedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-text-grey mb-1">Full Name</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-text-grey mb-1">Category</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} required className="w-full p-3 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green">
                  <option value="">Select Category</option>
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="class">class</option>
                  <option value="outside">outsider</option>
                </select>
              </div>

              <div>
                <label htmlFor="batch" className="block text-sm font-semibold text-text-grey mb-1">Batch</label>
                <input id="batch" name="batch" value={formData.batch} onChange={handleChange} required placeholder="e.g., Inshirah, Foundation A" className="w-full p-3 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="barcode" className="block text-sm font-semibold text-text-grey mb-1">Barcode</label>
                <input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} required placeholder="e.g., U445" className="w-full p-3 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
              >
                <UserPlus size={20} />
                {loading ? 'Adding...' : 'Add Patron'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}