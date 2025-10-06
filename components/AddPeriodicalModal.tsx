'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodical } from '@/app/periodicals/page'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  periodicalToEdit?: Periodical | null;
}

export default function AddPeriodicalModal({ isOpen, onClose, onSuccess, periodicalToEdit }: Props) {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [type, setType] = useState('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (periodicalToEdit) {
      setName(periodicalToEdit.name);
      setLanguage(periodicalToEdit.language);
      setImageUrl(periodicalToEdit.image_url);
      setType(periodicalToEdit.type);
    } else {
      setName('');
      setLanguage('');
      setImageUrl('');
      setType('monthly');
    }
  }, [periodicalToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const periodicalData = { name, language, image_url: imageUrl, type };

    const { error } = periodicalToEdit
      ? await supabase.from('periodicals').update(periodicalData).eq('id', periodicalToEdit.id)
      : await supabase.from('periodicals').insert(periodicalData);

    if (error) {
      console.error(error);
      alert(`Failed to ${periodicalToEdit ? 'update' : 'add'} periodical.`);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-lg w-full border border-primary-dark-grey" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
          <h2 className="text-lg font-bold font-heading">{periodicalToEdit ? 'Edit Periodical' : 'Add New Periodical'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-grey hover:bg-primary-dark-grey hover:text-red-500 transition">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-text-grey">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-grey">Language</label>
              <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} required className="w-full mt-1 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
            </div>
             <div>
              <label className="text-sm font-semibold text-text-grey">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full mt-1 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-text-grey">Image URL</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required className="w-full mt-1 p-2 border border-primary-dark-grey rounded-md bg-primary-grey focus:outline-none focus:ring-2 focus:ring-dark-green" />
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-semibold text-white bg-dark-green rounded-lg hover:bg-icon-green disabled:opacity-70">
              {loading ? 'Saving...' : (periodicalToEdit ? 'Save Changes' : 'Add Periodical')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
