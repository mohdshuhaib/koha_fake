'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { Download, AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react'
import clsx from 'classnames'

// --- Type Definitions ---
type Book = { title: string; author: string; barcode: string; pages: number | null }
type Member = { name: string; batch: string; barcode: string; category: string }

type BorrowRecord = {
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: boolean;
  paid_amount: number;
  books: Book | null;
  members: Member | null;
  member_id: string;
  book_id: string;
}

type PeriodicalRecord = {
  borrow_date: string;
  return_date: string | null;
  issue_identifier: string;
  borrower_name: string;
  periodicals: { name: string } | null;
}

type FinePayment = {
  payment_date: string;
  amount_paid: number;
  notes: string | null;
  borrow_records: {
      fine: number;
      paid_amount: number;
      books: { title: string } | null;
      members: { name: string } | null;
  } | null;
}

type RankedItem = { name: string; count: number; totalPages?: number }

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchAndDownloadBackup = async () => {
    setLoading(true)
    setFeedback({ type: 'info', message: 'Preparing backup... This may take a moment.' })

    try {
      // 1. Fetch all data
      const [
        borrowRecordsRes,
        periodicalRecordsRes,
        finePaymentsRes
      ] = await Promise.all([
        supabase.from('borrow_records').select(`
            borrow_date, due_date, return_date, fine, fine_paid, paid_amount, member_id, book_id,
            books!inner(title, author, barcode, pages),
            members!inner(name, batch, barcode, category)
        `).order('borrow_date', { ascending: false }),
        supabase.from('periodical_records').select(`
            borrow_date, return_date, issue_identifier, borrower_name,
            periodicals!inner(name)
        `).order('borrow_date', { ascending: false }),
        supabase.from('fine_payments').select(`
            payment_date, amount_paid, notes,
            borrow_records!inner(
                fine, paid_amount,
                books!inner(title),
                members!inner(name)
            )
        `).order('payment_date', { ascending: false })
      ]);

      const borrowRecords = borrowRecordsRes.data as unknown as BorrowRecord[] || [];
      const finePayments = finePaymentsRes.data as unknown as FinePayment[] || [];

      // --- 2. Process Borrowing History (Raw Data) ---
      const borrowHistoryData = borrowRecords.map(r => ({
        'Member Name': r.members?.name,
        'Member Barcode': r.members?.barcode,
        'Batch': r.members?.batch,
        'Book Title': r.books?.title,
        'Book Barcode': r.books?.barcode,
        'Pages': r.books?.pages || 0,
        'Borrowed Date': dayjs(r.borrow_date).format('YYYY-MM-DD'),
        'Due Date': dayjs(r.due_date).format('YYYY-MM-DD'),
        'Return Date': r.return_date ? dayjs(r.return_date).format('YYYY-MM-DD') : 'Not Returned',
        'Fine': r.fine,
        'Amount Paid': r.paid_amount,
      }));

      // --- 3. Process "Fine Payments" Sheet (Dashboard Style) ---
      // Calculate Summaries
      const totalCollected = finePayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

      // Calculate Outstanding (From Borrow Records where fine > 0 and not paid)
      const totalOutstanding = borrowRecords
        .filter(r => !r.fine_paid && r.fine > 0)
        .reduce((sum, r) => sum + ((r.fine || 0) - (r.paid_amount || 0)), 0);

      // Calculate Waived (From Payments marked as Write-Off)
      const totalWaived = finePayments
        .filter(p => p.notes?.startsWith('Write-Off'))
        .reduce((sum, p) => {
             // For a write-off, the 'waived' amount is essentially the remaining balance
             // stored in the linked borrow record at the time of fetching
             const rec = p.borrow_records;
             if (!rec) return sum;
             // Logic: if it was written off, fine - paid_amount is the waived portion
             return sum + ((rec.fine || 0) - (rec.paid_amount || 0));
        }, 0);

      // Build the Fine Data Rows (List of all records with fines)
      const fineRecordsList = borrowRecords
        .filter(r => r.fine > 0)
        .map(r => ({
            'Member': r.members?.name,
            'Batch': r.members?.batch,
            'Book': r.books?.title,
            'Total': r.fine,
            'Paid': r.paid_amount,
            'Remaining': r.fine - r.paid_amount
        }));

      // Construct the Sheet Data with Headers and Spacing
      const finesSheetData = [
        // Summary Section
        { Member: 'SUMMARY STATS', Batch: '', Book: '', Total: '', Paid: '', Remaining: '' },
        { Member: 'Total Collected', Batch: '', Book: '', Total: totalCollected, Paid: '', Remaining: '' },
        { Member: 'Total Outstanding', Batch: '', Book: '', Total: totalOutstanding, Paid: '', Remaining: '' },
        { Member: 'Total Waived', Batch: '', Book: '', Total: totalWaived, Paid: '', Remaining: '' },
        { Member: '', Batch: '', Book: '', Total: '', Paid: '', Remaining: '' }, // Spacer

        // Table Header
        { Member: 'MEMBER', Batch: 'BATCH', Book: 'BOOK', Total: 'TOTAL FINE', Paid: 'PAID', Remaining: 'REMAINING' },

        // Table Data
        ...fineRecordsList
      ];

      // --- 4. Calculate Top Stats ---
      const readerStats: Record<string, RankedItem> = {};
      const batchStats: Record<string, RankedItem> = {};
      const bookStats: Record<string, RankedItem> = {};

      borrowRecords.forEach(r => {
        const memberName = r.members?.name || 'Unknown';
        const memberId = r.member_id;
        const batch = r.members?.batch;
        const bookTitle = r.books?.title || 'Unknown';
        const bookId = r.book_id;
        const pages = r.books?.pages || 0;
        const isReturned = !!r.return_date;
        const isStudent = r.members?.category === 'student';

        if (isReturned && isStudent) {
            if (!readerStats[memberId]) readerStats[memberId] = { name: memberName, count: 0, totalPages: 0 };
            readerStats[memberId].count += 1;
            readerStats[memberId].totalPages! += pages;
        }
        if (isReturned && batch && isStudent) {
            if (!batchStats[batch]) batchStats[batch] = { name: batch, count: 0, totalPages: 0 };
            batchStats[batch].count += 1;
            batchStats[batch].totalPages! += pages;
        }
        if (bookTitle) {
            if (!bookStats[bookId]) bookStats[bookId] = { name: bookTitle, count: 0 };
            bookStats[bookId].count += 1;
        }
      });

      const topReadersByBooks = Object.values(readerStats).sort((a, b) => b.count - a.count).slice(0, 5);
      const topReadersByPages = Object.values(readerStats).sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0)).slice(0, 5);
      const topBatchesByBooks = Object.values(batchStats).sort((a, b) => b.count - a.count).slice(0, 5);
      const topBatchesByPages = Object.values(batchStats).sort((a, b) => (b.totalPages || 0) - (a.totalPages || 0)).slice(0, 5);
      const topBooksPopularity = Object.values(bookStats).sort((a, b) => b.count - a.count).slice(0, 5);

      const statsSheetData = [
        { Category: '--- TOP READERS (BY BOOKS READ) ---', Rank: '', Name: '', Count: '', Pages: '' },
        ...topReadersByBooks.map((r, i) => ({ Category: 'Reader (Books)', Rank: i + 1, Name: r.name, Count: r.count, Pages: r.totalPages })),
        { Category: '' },
        { Category: '--- TOP READERS (BY PAGES READ) ---', Rank: '', Name: '', Count: '', Pages: '' },
        ...topReadersByPages.map((r, i) => ({ Category: 'Reader (Pages)', Rank: i + 1, Name: r.name, Count: r.count, Pages: r.totalPages })),
        { Category: '' },
        { Category: '--- TOP BATCHES (BY BOOKS READ) ---', Rank: '', Name: '', Count: '', Pages: '' },
        ...topBatchesByBooks.map((r, i) => ({ Category: 'Batch (Books)', Rank: i + 1, Name: r.name, Count: r.count, Pages: r.totalPages })),
        { Category: '' },
        { Category: '--- TOP BATCHES (BY PAGES READ) ---', Rank: '', Name: '', Count: '', Pages: '' },
        ...topBatchesByPages.map((r, i) => ({ Category: 'Batch (Pages)', Rank: i + 1, Name: r.name, Count: r.count, Pages: r.totalPages })),
        { Category: '' },
        { Category: '--- MOST POPULAR BOOKS ---', Rank: '', Name: '', Count: '', Pages: '' },
        ...topBooksPopularity.map((r, i) => ({ Category: 'Popular Books', Rank: i + 1, Name: r.name, Count: r.count, Pages: '-' })),
      ];

      // --- 5. Other Sheets ---
      const periodicalsHistoryData = (periodicalRecordsRes.data as PeriodicalRecord[] | null)?.map(r => ({
        'Periodical Name': r.periodicals?.name,
        'Issue/Identifier': r.issue_identifier,
        'Borrower Name': r.borrower_name,
        'Borrowed Date': dayjs(r.borrow_date).format('YYYY-MM-DD'),
        'Return Date': r.return_date ? dayjs(r.return_date).format('YYYY-MM-DD') : 'Not Returned'
      })) || [];

      // 6. Generate Workbook
      const wb = XLSX.utils.book_new();

      // Create sheets
      const wsBorrowing = XLSX.utils.json_to_sheet(borrowHistoryData);
      const wsStats = XLSX.utils.json_to_sheet(statsSheetData);
      const wsPeriodicals = XLSX.utils.json_to_sheet(periodicalsHistoryData);

      // For fines, we use skipHeader: true because we manually created headers in the array
      const wsFines = XLSX.utils.json_to_sheet(finesSheetData, { skipHeader: true });

      // Append sheets
      XLSX.utils.book_append_sheet(wb, wsBorrowing, 'Borrowing History');
      XLSX.utils.book_append_sheet(wb, wsStats, 'Top Stats Summary');
      XLSX.utils.book_append_sheet(wb, wsFines, 'Fine Payments'); // Updated Sheet
      XLSX.utils.book_append_sheet(wb, wsPeriodicals, 'Periodicals History');

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
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const deleteAllRecords = async () => {
    const confirmDelete = window.confirm('⚠ Are you sure you want to delete all borrow records? This action cannot be undone!')
    if (!confirmDelete) return

    setLoading(true);
    setFeedback({ type: 'info', message: 'Deleting records...' });
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

          <div className="bg-secondary-white border border-primary-dark-grey rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-grey p-3 rounded-lg"><Download className="text-dark-green" size={24} /></div>
              <div>
                <h2 className="text-xl font-bold font-heading text-heading-text-black">Generate Full Backup</h2>
                <p className="text-sm text-text-grey mt-1 mb-4">
                  Download a comprehensive Excel file containing all borrowing history, periodical records, fine payments, and calculated top statistics (Readers by Books/Pages, Batches by Books/Pages).
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