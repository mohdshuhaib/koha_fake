'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodical, PeriodicalRecord } from '@/app/periodicals/page'

type Props = {
  periodical: Periodical;
  records: PeriodicalRecord[];
  onUpdate: () => void;
  onEdit: () => void; // ✨ Prop to trigger edit mode
}

export default function PeriodicalCard({ periodical, records, onUpdate, onEdit }: Props) {
  const [newRecord, setNewRecord] = useState({ borrow_date: '', issue_identifier: '', borrower_name: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBorrower = async () => {
    if (!newRecord.borrow_date || !newRecord.borrower_name) {
      alert('Please fill in at least the borrow date and borrower name.');
      return;
    }

    const { error } = await supabase
      .from('periodical_records')
      .insert({ ...newRecord, periodical_id: periodical.id });

    if (error) {
      alert('Failed to add record.');
    } else {
      setIsAdding(false);
      setNewRecord({ borrow_date: '', issue_identifier: '', borrower_name: '' });
      onUpdate();
    }
  };

  const handleReturn = async (recordId: string) => {
    const confirmed = window.confirm('Are you sure you want to mark this as returned?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('periodical_records')
      .update({ return_date: new Date().toISOString() })
      .eq('id', recordId);

    if (error) alert('Failed to update record.');
    else onUpdate();
  };

  // ✨ Function to handle deleting a periodical
  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${periodical.name}"? This will also delete all of its borrowing records.`);
    if (!confirmed) return;

    const { error } = await supabase
        .from('periodicals')
        .delete()
        .eq('id', periodical.id);

    if (error) {
        alert('Failed to delete periodical.');
    } else {
        alert('Periodical deleted successfully.');
        onUpdate(); // Refresh the list
    }
  }

  return (
    <div className="bg-secondary-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-6">
            <img src={periodical.image_url || '/placeholder.png'} alt={periodical.name} className="w-24 h-32 object-cover rounded-md shadow-md"/>
            <div>
                <h2 className="text-2xl font-bold text-heading-text-black">{periodical.name}</h2>
                <p className="text-text-grey">{periodical.language} - <span className="capitalize">{periodical.type}</span></p>
            </div>
        </div>
        {/* ✨ Edit and Delete buttons */}
        <div className="flex gap-2">
            <button onClick={onEdit} className="text-sm text-blue-600 hover:underline">Edit</button>
            <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-primary-grey">
            <tr>
              <th className="p-3 text-left">Borrow Date</th>
              <th className="p-3 text-left">Issue / Date No.</th>
              <th className="p-3 text-left">Borrower Name</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-primary-dark-grey">
                <td className="p-3">{new Date(record.borrow_date).toLocaleDateString()}</td>
                <td className="p-3">{record.issue_identifier}</td>
                <td className="p-3">{record.borrower_name}</td>
                <td className="p-3">
                  {record.return_date ? (
                    <button disabled className="bg-gray-400 text-white px-3 py-1 rounded-md text-xs cursor-not-allowed">
                      Returned
                    </button>
                  ) : (
                    <button onClick={() => handleReturn(record.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700">
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {isAdding && (
              <tr className="bg-blue-50 border-t border-primary-dark-grey">
                <td className="p-2"><input type="date" value={newRecord.borrow_date} onChange={(e) => setNewRecord({...newRecord, borrow_date: e.target.value})} className="w-full p-2 border rounded"/></td>
                <td className="p-2"><input type="text" placeholder="e.g., No. 221" value={newRecord.issue_identifier} onChange={(e) => setNewRecord({...newRecord, issue_identifier: e.target.value})} className="w-full p-2 border rounded"/></td>
                <td className="p-2"><input type="text" placeholder="Borrower's Name" value={newRecord.borrower_name} onChange={(e) => setNewRecord({...newRecord, borrower_name: e.target.value})} className="w-full p-2 border rounded"/></td>
                <td className="p-2">
                    <button onClick={handleAddBorrower} className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs hover:bg-blue-700">Save</button>
                    <button onClick={() => setIsAdding(false)} className="ml-2 text-xs text-gray-600">Cancel</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300">
                + Add New Borrower
            </button>
        )}
      </div>
    </div>
  );
}
