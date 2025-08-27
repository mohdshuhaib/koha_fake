'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodical } from '@/app/periodicals/page'

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  periodicalToEdit?: Periodical | null; // ✨ Optional prop for editing
}

export default function AddPeriodicalModal({ isOpen, onClose, onSuccess, periodicalToEdit }: Props) {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [type, setType] = useState('monthly')
  const [loading, setLoading] = useState(false)

  // ✨ Pre-fill form if in edit mode
  useEffect(() => {
    if (periodicalToEdit) {
      setName(periodicalToEdit.name);
      setLanguage(periodicalToEdit.language);
      setImageUrl(periodicalToEdit.image_url);
      setType(periodicalToEdit.type);
    } else {
      // Reset form if in "add" mode
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

    let error;

    if (periodicalToEdit) {
      // ✨ UPDATE logic
      const { error: updateError } = await supabase
        .from('periodicals')
        .update(periodicalData)
        .eq('id', periodicalToEdit.id);
      error = updateError;
    } else {
      // ✨ INSERT logic (original)
      const { error: insertError } = await supabase
        .from('periodicals')
        .insert(periodicalData);
      error = insertError;
    }

    if (error) {
      alert(`Failed to ${periodicalToEdit ? 'update' : 'add'} periodical.`);
      console.error(error);
    } else {
      alert(`✅ Periodical ${periodicalToEdit ? 'updated' : 'added'} successfully!`);
      onSuccess();
      onClose();
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* ✨ Dynamic title */}
        <h2 className="text-2xl font-bold mb-6">{periodicalToEdit ? 'Edit Periodical' : 'Add New Periodical'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} required className="mt-1 w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {loading ? 'Saving...' : (periodicalToEdit ? 'Save Changes' : 'Add Periodical')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
