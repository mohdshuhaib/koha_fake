'use client'

import { useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodical, PeriodicalRecord } from '@/app/periodicals/page'
import { ChevronDown, Edit, Trash2, Plus, Save, X, AlertTriangle } from 'lucide-react'
import clsx from 'classnames'
import dayjs from 'dayjs'

export default function PeriodicalCard({ periodical, records, onUpdate, onEdit }: { periodical: Periodical, records: PeriodicalRecord[], onUpdate: () => void, onEdit: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newRecord, setNewRecord] = useState({ issue_identifier: '', borrower_name: '', borrow_date: dayjs().format('YYYY-MM-DD') })

  // State for the confirmation modal
  const [confirmAction, setConfirmAction] = useState<{ type: 'return' | 'delete', data: any, message: string } | null>(null)

  const handleAddBorrower = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecord.borrow_date || !newRecord.borrower_name) return

    const { error } = await supabase.from('periodical_records').insert({ ...newRecord, periodical_id: periodical.id });
    if (!error) {
      setIsAdding(false)
      setNewRecord({ borrow_date: dayjs().format('YYYY-MM-DD'), issue_identifier: '', borrower_name: '' })
      onUpdate()
    } else {
      console.error(error)
    }
  };

  const handleReturn = async (recordId: string) => {
    const { error } = await supabase.from('periodical_records').update({ return_date: new Date().toISOString() }).eq('id', recordId)
    if (error) console.error(error)
    else onUpdate()
    setConfirmAction(null)
  };

  const handleDelete = async (periodicalId: string) => {
    // Supabase cascade delete should handle related records if set up.
    // Otherwise, you need an RPC function for safe deletion.
    const { error } = await supabase.from('periodicals').delete().eq('id', periodicalId)
    if (error) console.error(error)
    else onUpdate()
    setConfirmAction(null)
  }

  const performConfirmAction = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'return') handleReturn(confirmAction.data.id)
    if (confirmAction.type === 'delete') handleDelete(confirmAction.data.id)
  }

  return (
    <>
      <div className="bg-secondary-white border border-primary-dark-grey rounded-xl shadow-md transition-all duration-300">
        <div className="flex items-center p-4 cursor-pointer hover:bg-primary-grey/50" onClick={() => setIsOpen(!isOpen)}>
          <img src={periodical.image_url || '/placeholder.png'} alt={periodical.name} className="w-16 h-20 object-cover rounded-md mr-4" />
          <div className="flex-grow">
            <h2 className="font-bold text-xl text-heading-text-black">{periodical.name}</h2>
            <div className="flex items-center gap-4 text-sm text-text-grey mt-1">
              <span>{periodical.language}</span>
              <span className="px-2 py-0.5 bg-primary-grey rounded-full capitalize">{periodical.type}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-text-grey hover:bg-primary-dark-grey rounded-full transition" title="Edit Periodical"><Edit size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmAction({type: 'delete', data: periodical, message: `This will permanently delete "${periodical.name}" and all its records.`})}} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition" title="Delete Periodical"><Trash2 size={16} /></button>
            <ChevronDown size={24} className={clsx("transition-transform text-text-grey", { "rotate-180": isOpen })} />
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-primary-dark-grey p-4 space-y-4">
            <h3 className="font-bold text-heading-text-black">Borrow History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-primary-grey"><tr className="text-left text-text-grey"><th className="p-2">Issue</th><th className="p-2">Borrower</th><th className="p-2">Date</th><th className="p-2 text-center">Status</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-primary-dark-grey last:border-b-0">
                      <td className="p-2 text-text-grey">{r.issue_identifier}</td>
                      <td className="p-2 font-semibold text-heading-text-black">{r.borrower_name}</td>
                      <td className="p-2 text-text-grey">{dayjs(r.borrow_date).format('DD MMM YYYY')}</td>
                      <td className="p-2 text-center">
                        {r.return_date
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Returned</span>
                          : <button onClick={() => setConfirmAction({type: 'return', data: r, message: `Mark this issue as returned?`})} className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600">Return</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isAdding ? (
              <form onSubmit={handleAddBorrower} className="bg-primary-grey p-3 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="date" value={newRecord.borrow_date} onChange={e => setNewRecord({...newRecord, borrow_date: e.target.value})} className="w-full p-2 border border-primary-dark-grey rounded-md" required />
                  <input type="text" placeholder="Issue No. or Title" value={newRecord.issue_identifier} onChange={e => setNewRecord({...newRecord, issue_identifier: e.target.value})} className="w-full p-2 border border-primary-dark-grey rounded-md" />
                  <input type="text" placeholder="Borrower's Name" value={newRecord.borrower_name} onChange={e => setNewRecord({...newRecord, borrower_name: e.target.value})} className="w-full p-2 border border-primary-dark-grey rounded-md" required />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="p-2 text-text-grey hover:bg-primary-dark-grey rounded-full"><X size={18}/></button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-dark-green text-white rounded-lg hover:bg-icon-green"><Save size={14}/> Save Record</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-dark-grey text-heading-text-black rounded-lg hover:bg-gray-300 transition">
                <Plus size={16} /> Add New Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={performConfirmAction}
        title={`Confirm ${confirmAction?.type === 'delete' ? 'Deletion' : 'Return'}`}
        message={confirmAction?.message || ''}
        isDestructive={confirmAction?.type === 'delete'}
      />
    </>
  )
}

// --- Reusable Confirmation Modal ---
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, isDestructive = false }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, isDestructive?: boolean }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-sm w-full border border-primary-dark-grey">
        <div className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-xl font-bold font-heading text-heading-text-black">{title}</h3>
          <p className="mt-2 text-sm text-text-grey">{message}</p>
        </div>
        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
          <button onClick={onConfirm} className={clsx("px-5 py-2 text-sm font-semibold text-white rounded-lg", isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-dark-green hover:bg-icon-green')}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}