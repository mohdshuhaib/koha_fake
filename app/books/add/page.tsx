'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AddBookPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    shelf_location: '',
    call_number: '',
    language: '',
    barcode: '',
    status: 'available',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        shelf_location: '',
        call_number: '',
        language: '',
        barcode: '',
        status: 'available',
      })
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Book</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="author" placeholder="Author" value={formData.author} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="shelf_location" placeholder="Shelf Location" value={formData.shelf_location} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="call_number" placeholder="Call Number" value={formData.call_number} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="language" placeholder="Language" value={formData.language} onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="barcode" placeholder="Barcode" value={formData.barcode} onChange={handleChange} required className="w-full p-2 border rounded" />

        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="available">Available</option>
          <option value="issued">Issued</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Book</button>
      </form>
    </div>
  )
}
