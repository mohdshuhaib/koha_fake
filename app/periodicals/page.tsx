'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '../loading'
import AddPeriodicalModal from '@/components/AddPeriodicalModal'
import PeriodicalCard from '@/components/PeriodicalCard'

// Define types for our data for better code quality
export type Periodical = {
  id: string;
  name: string;
  language: string;
  image_url: string;
  type: string;
}

export type PeriodicalRecord = {
  id: string;
  periodical_id: string;
  borrow_date: string;
  issue_identifier: string;
  borrower_name: string;
  return_date: string | null;
}

export default function PeriodicalsPage() {
  const [loading, setLoading] = useState(true)
  const [periodicals, setPeriodicals] = useState<Periodical[]>([])
  const [records, setRecords] = useState<PeriodicalRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPeriodical, setEditingPeriodical] = useState<Periodical | null>(null) // ✨ State to hold the periodical being edited

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: periodicalsData, error: periodicalsError } = await supabase.from('periodicals').select('*').order('name');
    const { data: recordsData, error: recordsError } = await supabase.from('periodical_records').select('*');

    if (periodicalsData) setPeriodicals(periodicalsData)
    if (recordsData) setRecords(recordsData)

    if (periodicalsError || recordsError) {
        console.error('Error fetching data:', periodicalsError || recordsError)
    }
    setLoading(false)
  }

  // ✨ Function to open the modal in edit mode
  const handleEdit = (periodical: Periodical) => {
    setEditingPeriodical(periodical);
    setIsModalOpen(true);
  };

  // ✨ Function to close the modal and reset the editing state
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPeriodical(null);
  };

  const recordsByPeriodicalId = records.reduce((acc, record) => {
    const key = record.periodical_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {} as Record<string, PeriodicalRecord[]>);

  if (loading) return <Loading />

  return (
    <>
      <div className="min-h-screen bg-primary-grey pt-32 px-4 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-heading-text-black font-heading uppercase">
              Periodicals
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-button-yellow text-button-text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-500 transition shadow-md"
            >
              + Add New Periodical
            </button>
          </div>

          <div className="space-y-8">
            {periodicals.length > 0 ? (
              periodicals.map((periodical) => (
                <PeriodicalCard
                  key={periodical.id}
                  periodical={periodical}
                  records={recordsByPeriodicalId[periodical.id] || []}
                  onUpdate={fetchData}
                  onEdit={() => handleEdit(periodical)} // ✨ Pass edit handler
                />
              ))
            ) : (
                <p className="text-center text-text-grey bg-secondary-white p-8 rounded-xl">No periodicals found. Click 'Add New Periodical' to get started.</p>
            )}
          </div>
        </div>
      </div>
      {/* ✨ Pass editing state and correct close handler to modal */}
      <AddPeriodicalModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={fetchData}
        periodicalToEdit={editingPeriodical}
      />
    </>
  )
}
