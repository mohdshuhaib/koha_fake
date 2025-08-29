'use client'

import { useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { Download, AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react'
import clsx from 'classnames'
import Link from 'next/link'

// --- Type Definitions (from your original code) ---
type Book = { title: string; author: string; barcode: string; }
type Member = { name: string; batch: string; barcode: string; }
type BorrowRecord = { borrow_date: string; due_date: string; return_date: string | null; fine: number; fine_paid: boolean; paid_amount: number; books: Book | null; members: Member | null; }
type PeriodicalRecord = { borrow_date: string; return_date: string | null; issue_identifier: string; borrower_name: string; periodicals: { name: string } | null; }
type FinePayment = { payment_date: string; amount_paid: number; borrow_records: { books: { title: string } | null; members: { name: string } | null; } | null; }

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchAndDownloadBackup = async () => {
    setLoading(true)
    setFeedback({ type: 'info', message: 'Preparing backup... This may take a moment.' })

    try {
      const [
        borrowRecordsRes,
        periodicalRecordsRes,
        finePaymentsRes
      ] = await Promise.all([
        supabase.from('borrow_records').select(`borrow_date, due_date, return_date, fine, fine_paid, paid_amount, books!inner(title, author, barcode), members!inner(name, batch, barcode)`).order('borrow_date', { ascending: false }),
        supabase.from('periodical_records').select(`borrow_date, return_date, issue_identifier, borrower_name, periodicals!inner(name)`).order('borrow_date', { ascending: false }),
        supabase.from('fine_payments').select(`payment_date, amount_paid, borrow_records!inner(books!inner(title), members!inner(name))`).order('payment_date', { ascending: false })
      ]);

      // --- Process Data (logic is the same as your original) ---
      const borrowHistoryData = (borrowRecordsRes.data as BorrowRecord[] | null)?.map(r => ({ 'Member Name': r.members?.name, 'Batch': r.members?.batch, 'Book Title': r.books?.title, 'Borrowed Date': dayjs(r.borrow_date).format('YYYY-MM-DD'), 'Due Date': dayjs(r.due_date).format('YYYY-MM-DD'), 'Return Date': r.return_date ? dayjs(r.return_date).format('YYYY-MM-DD') : 'Not Returned', 'Fine': r.fine, 'Amount Paid': r.paid_amount, })) || [];
      const topMembers = calculateTop(borrowRecordsRes.data as BorrowRecord[] | null, (r) => r.members?.name);
      const topBooks = calculateTop(borrowRecordsRes.data as BorrowRecord[] | null, (r) => r.books?.title);
      const topBatches = calculateTop(borrowRecordsRes.data as BorrowRecord[] | null, (r) => r.members?.batch);
      const statsData = [ { Category: 'Top Readers', Rank: 1, Name: topMembers[0]?.name || '', Count: topMembers[0]?.count || '' }, { Category: 'Top Readers', Rank: 2, Name: topMembers[1]?.name || '', Count: topMembers[1]?.count || '' }, { Category: 'Top Readers', Rank: 3, Name: topMembers[2]?.name || '', Count: topMembers[2]?.count || '' }, { Category: 'Top Readers', Rank: 4, Name: topMembers[3]?.name || '', Count: topMembers[3]?.count || '' }, { Category: 'Top Readers', Rank: 5, Name: topMembers[4]?.name || '', Count: topMembers[4]?.count || '' }, { Category: '' }, { Category: 'Top Books', Rank: 1, Name: topBooks[0]?.name || '', Count: topBooks[0]?.count || '' }, { Category: 'Top Books', Rank: 2, Name: topBooks[1]?.name || '', Count: topBooks[1]?.count || '' }, { Category: 'Top Books', Rank: 3, Name: topBooks[2]?.name || '', Count: topBooks[2]?.count || '' }, { Category: 'Top Books', Rank: 4, Name: topBooks[3]?.name || '', Count: topBooks[3]?.count || '' }, { Category: 'Top Books', Rank: 5, Name: topBooks[4]?.name || '', Count: topBooks[4]?.count || '' }, { Category: '' }, { Category: 'Top Batches', Rank: 1, Name: topBatches[0]?.name || '', Count: topBatches[0]?.count || '' }, { Category: 'Top Batches', Rank: 2, Name: topBatches[1]?.name || '', Count: topBatches[1]?.count || '' }, { Category: 'Top Batches', Rank: 3, Name: topBatches[2]?.name || '', Count: topBatches[2]?.count || '' }, { Category: 'Top Batches', Rank: 4, Name: topBatches[3]?.name || '', Count: topBatches[3]?.count || '' }, { Category: 'Top Batches', Rank: 5, Name: topBatches[4]?.name || '', Count: topBatches[4]?.count || '' }, ];
      const periodicalsHistoryData = (periodicalRecordsRes.data as PeriodicalRecord[] | null)?.map(r => ({ 'Periodical Name': r.periodicals?.name, 'Issue/Identifier': r.issue_identifier, 'Borrower Name': r.borrower_name, 'Borrowed Date': dayjs(r.borrow_date).format('YYYY-MM-DD'), 'Return Date': r.return_date ? dayjs(r.return_date).format('YYYY-MM-DD') : 'Not Returned', })) || [];
      const finePaymentsData = (finePaymentsRes.data as FinePayment[] | null)?.map(r => ({ 'Payment Date': dayjs(r.payment_date).format('YYYY-MM-DD HH:mm'), 'Member Name': r.borrow_records?.members?.name, 'Book Title': r.borrow_records?.books?.title, 'Amount Paid': r.amount_paid, })) || [];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(borrowHistoryData), 'Borrowing History');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsData), 'Top Stats Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodicalsHistoryData), 'Periodicals History');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finePaymentsData), 'Fine Payments');

      const fileName = `library_backup_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setFeedback({ type: 'success', message: `Backup downloaded successfully as ${fileName}` });
    } catch (error) {
      console.error('Backup failed:', error);
      setFeedback({ type: 'error', message: 'Failed to create backup. Check the console for details.' });
    } finally {
      setLoading(false);
    }
  }

  const calculateTop = (data: any[] | null, keySelector: (item: any) => string | undefined) => {
    if (!data) return [];
    const counts: { [key: string]: number } = {};
    data.forEach(item => {
      const key = keySelector(item);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const deleteAllRecords = async () => {
    setLoading(true);
    setFeedback({ type: 'info', message: 'Deleting records...' });
    // In Supabase, you can set up a "cascade delete" so this is not needed.
    // But for safety, we'll keep it. A better approach is an RPC function.
    const { error } = await supabase.from('borrow_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      setFeedback({ type: 'error', message: `Failed to delete records: ${error.message}` });
    } else {
      setFeedback({ type: 'success', message: 'All borrow records have been permanently deleted.' });
    }
    setLoading(false);
    setIsModalOpen(false);
  }

  return (
    <>
      <main className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading-text-black uppercase tracking-wider">
              Library Backup & Restore
            </h1>
            <p className="text-text-grey mt-1">Manage and secure your library's data.</p>
          </div>

          {/* --- Backup Card --- */}
          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-grey p-3 rounded-lg"><Download className="text-dark-green" size={24} /></div>
              <div>
                <h2 className="text-xl font-bold font-heading text-heading-text-black">Generate Full Backup</h2>
                <p className="text-sm text-text-grey mt-1 mb-4">
                  Download a complete backup of all borrowing history, periodical records, and fine payments in a single Excel (.xlsx) file.
                </p>
                <button
                  onClick={fetchAndDownloadBackup}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-button-yellow text-button-text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-500 transition shadow disabled:opacity-70 disabled:cursor-wait"
                >
                  <Download size={18} />
                  {loading ? 'Generating...' : 'Download Backup'}
                </button>
              </div>
            </div>
          </div>

          {feedback && !loading && (
            <div className={clsx("flex items-start gap-3 p-3 rounded-lg text-sm",
                feedback.type === 'error' && 'bg-red-100 text-red-800',
                feedback.type === 'success' && 'bg-green-100 text-green-800',
                feedback.type === 'info' && 'bg-blue-100 text-blue-800'
            )}>
              {feedback.type === 'success' ? <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5"/> : <AlertTriangle size={20} className="flex-shrink-0 mt-0.5"/>}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* --- Danger Zone Card --- */}
          <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="text-red-600" size={24} /></div>
              <div>
                <h2 className="text-xl font-bold font-heading text-red-800">Danger Zone</h2>
                <p className="text-sm text-red-700 mt-1 mb-4">
                  This action will permanently delete all borrowing history. This is irreversible and should only be done at the end of an academic year. <strong className="font-extrabold">Ensure you have a recent backup first.</strong>
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition shadow disabled:opacity-70"
                >
                  <Trash2 size={18} />
                  Delete All Borrow Records
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={deleteAllRecords}
      />
    </>
  )
}

// --- Reusable Confirmation Modal ---
function ConfirmationModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const requiredText = 'DELETE'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-secondary-white rounded-xl shadow-2xl max-w-lg w-full border border-primary-dark-grey">
        <div className="p-4 border-b border-primary-dark-grey flex justify-between items-center">
          <h2 className="text-lg font-bold font-heading text-red-700">Confirm Irreversible Action</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-primary-dark-grey"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-grey">
            This action will permanently delete all borrow records from the database. This cannot be undone.
          </p>
          <p className="text-sm text-text-grey">
            To proceed, please type <strong className="text-red-700 font-mono">{requiredText}</strong> into the box below.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border border-primary-dark-grey rounded-md bg-primary-grey text-center font-bold tracking-widest"
          />
        </div>
        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== requiredText}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I understand, delete all records
          </button>
        </div>
      </div>
    </div>
  )
}