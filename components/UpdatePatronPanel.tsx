'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Define the type for Patron data
interface PatronData {
  name: string
  batch: string
  category: string
  barcode: string
}

export default function UpdatePatronPanel({ showPanel, setShowPanel }: { showPanel: boolean; setShowPanel: (val: boolean) => void }) {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [patron, setPatron] = useState<PatronData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showPanel) {
      setTimeout(() => barcodeRef.current?.focus(), 100)
    } else {
      resetForm()
    }
  }, [showPanel])

  const fetchPatron = async () => {
    setLoading(true)
    setMessage('')
    setPatron(null)
    const { data, error } = await supabase.from('members').select('*').eq('barcode', barcodeInput).single()

    if (error || !data) {
      setMessage('❌ Patron not found')
      setLoading(false)
      return
    }

    setPatron(data)
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!patron) return
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('members')
      .update({
        name: patron.name,
        batch: patron.batch,
        category: patron.category,
      })
      .eq('barcode', patron.barcode)

    if (error) {
      setMessage('❌ Failed to update patron')
    } else {
      setMessage('✅ Patron updated successfully')
    }

    // Reset form after a short delay to show the message
    setTimeout(() => {
        resetForm();
        barcodeRef.current?.focus();
    }, 2000);

    setLoading(false)
  }

  const resetForm = () => {
    setBarcodeInput('')
    setPatron(null)
    setMessage('')
    setLoading(false)
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[22rem] max-w-full bg-secondary-white border-l border-primary-dark-grey shadow-2xl transition-transform duration-300 z-[70] ${
        showPanel ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center px-4 py-4 border-b border-primary-dark-grey">
        <h2 className="text-xl font-bold text-heading-text-black font-heading">✏️ Update Patron</h2>
        <button onClick={() => setShowPanel(false)} className="text-red-600 hover:text-red-700 font-extrabold transition text-xl">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!patron && (
          <>
            <input
              ref={barcodeRef}
              type="text"
              placeholder="👤 Enter patron barcode"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPatron()}
            />
            <button
              onClick={fetchPatron}
              className="bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-medium px-6 py-2 rounded-lg shadow-md transition disabled:opacity-50"
              disabled={loading || !barcodeInput}
            >
              {loading ? '🔍 Searching...' : '🔍 Fetch Patron'}
            </button>
            {message && <p className="text-sm text-text-grey pt-1">{message}</p>}
          </>
        )}

        {patron && (
          <div className="space-y-4">
            <p className='text-sm font-medium'>Name</p>
            <input
              type="text"
              value={patron.name}
              onChange={(e) => setPatron({ ...patron, name: e.target.value })}
              placeholder="👤 Name"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Batch</p>
            <input
              type="text"
              value={patron.batch}
              onChange={(e) => setPatron({ ...patron, batch: e.target.value })}
              placeholder="🎓 Batch"
              className="w-full px-4 py-3 rounded-lg bg-secondary-white border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none"
            />
            <p className='text-sm font-medium'>Category</p>
            <input
              type="text"
              value={patron.category}
              readOnly
              placeholder="🏷️ Category"
              className="w-full px-4 py-3 bg-primary-dark-grey border border-primary-dark-grey text-text-grey rounded-lg cursor-not-allowed"
            />
            <p className='text-sm font-medium'>Barcode</p>
            <input
              type="text"
              value={patron.barcode}
              readOnly
              className="w-full px-4 py-3 bg-primary-dark-grey bordader border-primary-dark-grey text-text-grey rounded-lg cursor-not-allowed"
            />
            <button
              onClick={handleUpdate}
              className="bg-button-yellow hover:bg-primary-dark-grey text-button-text-black font-medium px-6 py-2 rounded-lg shadow-md transition"
              disabled={loading}
            >
              {loading ? '⏳ Updating...' : '💾 Update Patron'}
            </button>
            {message && <p className="text-sm text-text-grey pt-1">{message}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
