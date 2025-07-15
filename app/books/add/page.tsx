'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

export default function AddBookPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    language: '',
    shelf_location: '',
    call_number: '',
    barcode: '',
    status: 'available',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userload, setuserload] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const { error } = await supabase.from('books').insert([formData])
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Book added successfully!')
      setFormData({
        title: '',
        author: '',
        language: '',
        shelf_location: '',
        call_number: '',
        barcode: '',
        status: 'available',
      })
    }
  }

  return (
    <main className="min-h-screen pt-28 px-4 pb-10 bg-primary-grey">
      <div className="max-w-xl mx-auto bg-secondary-white p-6 md:p-8 rounded-2xl shadow-2xl border border-primary-dark-grey">
        <h1 className="text-3xl font-bold text-center mb-6 text-heading-text-black">📘 Add New Book</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}

          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          />
          <input
            name="author"
            placeholder="Author"
            value={formData.author}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          />
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey"
          >
            <option value="">Select Language</option>
            <option value="MAL" className='text-text-grey'>MAL</option>
            <option value="ARB" className='text-text-grey'>ARB</option>
            <option value="URD" className='text-text-grey'>URD</option>
          </select>
          <input
            name="shelf_location"
            placeholder="Shelf Location"
            value={formData.shelf_location}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          />
          <input
            name="call_number"
            placeholder="Call Number"
            value={formData.call_number}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          />
          <input
            name="barcode"
            placeholder="Barcode"
            value={formData.barcode}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey"
          >
            <option value="available" className='text-text-grey'>Available</option>
            <option value="issued" className='text-text-grey'>Issued</option>
          </select>

          <button
            type="submit"
            className="w-full bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-semibold py-2 px-4 rounded-lg transition"
          >
            ➕ Add Book
          </button>
        </form>
      </div>
    </main>
  )
}
