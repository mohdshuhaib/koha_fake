'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, FileText, Download, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import clsx from 'classnames'

type MemberRow = {
  name: string
  category: string
  barcode: string
  batch: string
}

export default function BulkUploadMembers() {
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const router = useRouter()

  // --- Authentication Logic ---
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const processFile = (file: File) => {
    setLoading(true)
    setUploadResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as MemberRow[]
        const validRows = rows.filter(r => r.name && r.category && r.barcode && r.batch)

        if (validRows.length === 0) {
          setUploadResult({ type: 'error', message: 'No valid rows found in the file. Please check the column headers and data.' })
          setLoading(false)
          return
        }

        // Simplified: Insert directly using the Supabase client library
        const { error } = await supabase.from('members').insert(validRows)

        if (error) {
          setUploadResult({ type: 'error', message: `Upload failed: ${error.message}` })
        } else {
          setUploadResult({ type: 'success', message: `${validRows.length} patrons were uploaded successfully!` })
          setSelectedFile(null) // Clear file on success
        }
        setLoading(false)
      },
      error: (err) => {
        setUploadResult({ type: 'error', message: `Failed to parse CSV file: ${err.message}` })
        setLoading(false)
      },
    })
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.type !== 'text/csv') {
        setUploadResult({ type: 'error', message: 'Invalid file type. Please upload a .csv file.' })
        return;
      }
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDownloadTemplate = () => {
    const headers = [['name', 'category', 'barcode', 'batch']];
    const csv = Papa.unparse(headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'library_patron_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && !isLoggedIn) return <Loading />
  if (!isLoggedIn) return null

  // --- REDESIGNED JSX ---
  return (
    <main className="min-h-screen pt-24 px-4 pb-10 bg-primary-grey">
      <div className="max-w-5xl mx-auto">
        <Link href="/members" className="flex items-center gap-2 text-text-grey font-semibold hover:text-heading-text-black transition mb-4">
          <ArrowLeft size={18} />
          Back to Patron Management
        </Link>
        <div className="bg-secondary-white p-6 md:p-8 rounded-2xl shadow-xl border border-primary-dark-grey">
          <div className="text-center border-b border-primary-dark-grey pb-6 mb-6">
            <h1 className="text-2xl font-bold text-heading-text-black uppercase font-heading tracking-wider">
              Bulk Upload Patrons
            </h1>
            <p className="text-text-grey mt-1">Upload a CSV file to add multiple members to the library at once.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- Left Side: Uploader --- */}
            <div className="space-y-4">
              <label
                htmlFor="file-upload"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  isDragging ? 'border-dark-green bg-green-50' : 'border-primary-dark-grey bg-primary-grey hover:bg-gray-200'
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-text-grey">
                  <UploadCloud size={40} className="mb-3" />
                  <p className="mb-2 text-sm font-semibold">Drag & drop CSV file here</p>
                  <p className="text-xs">or <span className="font-bold text-dark-green">click to browse</span></p>
                </div>
                <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
              </label>

              {selectedFile && !loading && (
                <div className="p-3 bg-primary-grey border border-primary-dark-grey rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-dark-green" />
                    <span className="text-sm font-medium text-heading-text-black">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><XCircle size={18} /></button>
                </div>
              )}

              {loading && <p className="mt-4 text-dark-green font-semibold text-center">Processing file, please wait...</p>}

              {uploadResult && (
                <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", uploadResult.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                  {uploadResult.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                  <span className="font-medium">{uploadResult.message}</span>
                </div>
              )}

              <button onClick={() => processFile(selectedFile!)} disabled={!selectedFile || loading} className="w-full bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60">
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>

            {/* --- Right Side: Instructions --- */}
            <div className="bg-primary-grey p-6 rounded-lg border border-primary-dark-grey">
              <h3 className="font-bold text-lg text-heading-text-black mb-3">Instructions</h3>
              <div className="space-y-3 text-sm text-text-grey">
                <p>1. Download the template CSV file to ensure your data is in the correct format.</p>
                <p>2. Fill in the patron details. The required columns are:</p>
                <div className="flex flex-wrap gap-2">
                  {['name', 'category', 'barcode', 'batch'].map(col => (
                    <code key={col} className="px-2 py-1 bg-gray-300 text-heading-text-black rounded text-xs font-semibold">{col}</code>
                  ))}
                </div>
                <p>3. Ensure the categories should be as given below (don't use capital letters)</p>
                <div className="flex flex-wrap gap-2">
                  {['student', 'teacher', 'class', 'outsider'].map(col => (
                    <code key={col} className="px-2 py-1 bg-gray-300 text-heading-text-black rounded text-xs font-semibold">{col}</code>
                  ))}
                </div>
                <p>4. Save the file as a CSV and upload it using the panel on the left.</p>
              </div>
              <button onClick={handleDownloadTemplate} className="w-full mt-6 flex items-center justify-center gap-2 bg-dark-green text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-icon-green transition">
                <Download size={16} /> Download Template.csv
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}