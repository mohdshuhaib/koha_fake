'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import Loading from '@/app/loading'

// Define types for better code clarity
type Member = {
  id: number
  name: string
  barcode: string
  batch: string
  category: string
}

type Record = {
  borrow_date: string
  due_date: string
  return_date: string | null
  fine: number
  fine_paid: boolean
  books: {
    title: string
  }
}

type MemberDetails = {
  name: string
  booksRead: number
  pendingFines: number
  history: Record[]
}

export default function PatronStatusPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15 // Members per page

  // State for the details modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Fetch all members on initial load
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select('id, name, barcode, batch, category')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching members:', error)
      } else if (data) {
        setMembers(data)
      }
      setLoading(false)
    }
    fetchMembers()
  }, [])

  // Function to fetch details for a specific member
  const handleViewDetails = async (member: Member) => {
    setSelectedMember(member)
    setDetailsLoading(true)
    setMemberDetails(null)

    const { data: records, error } = await supabase
      .from('borrow_records')
      .select('*, books(title)')
      .eq('member_id', member.id)
      .order('borrow_date', { ascending: false })

    if (error) {
      console.error('Error fetching records:', error)
      setDetailsLoading(false)
      return
    }

    const booksRead = records?.filter((r) => r.return_date !== null).length || 0
    const pendingFines = records?.reduce((acc, r) => acc + (r.fine_paid ? 0 : r.fine || 0), 0) || 0

    setMemberDetails({
      name: member.name,
      booksRead,
      pendingFines,
      history: records || [],
    })

    setDetailsLoading(false)
  }

  const closeModal = () => {
    setSelectedMember(null)
    setMemberDetails(null)
  }

  // Filter members based on search query (name or barcode)
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Apply pagination
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  if (loading) return <Loading />

  return (
    <div className="pt-32 min-h-screen bg-primary-grey px-4 pb-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-heading-text-black uppercase font-heading">
          Patron Status
        </h1>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            placeholder="Search by name or barcode..."
            className="w-full md:w-1/2 p-3 border border-primary-dark-grey rounded-md bg-secondary-white text-text-grey focus:outline-none focus:ring-2 focus:ring-button-yellow"
          />
        </div>

        {/* Members Table */}
        <div className="bg-secondary-white border border-primary-dark-grey rounded-xl overflow-x-auto shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="text-white uppercase bg-secondary-light-black">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Barcode</th>
                <th className="text-left p-3">Batch/Category</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="border-t border-primary-dark-grey hover:bg-primary-dark-grey transition text-text-grey">
                  <td className="p-3 font-semibold">{member.name}</td>
                  <td className="p-3">{member.barcode}</td>
                  <td className="p-3">{member.batch || member.category}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleViewDetails(member)}
                      className="bg-button-yellow text-button-text-black font-bold px-4 py-1 rounded-md hover:bg-yellow-500 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
             <p className="text-center p-4 text-text-grey">No members found.</p>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1 rounded bg-button-yellow border text-button-text-black border-primary-dark-grey hover:bg-primary-dark-grey disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="px-4 text-heading-text-black">
            Page {page} of {Math.ceil(filteredMembers.length / pageSize)}
          </span>
          <button
            disabled={page * pageSize >= filteredMembers.length}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1 rounded bg-button-yellow border text-button-text-black border-primary-dark-grey hover:bg-primary-dark-grey disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-secondary-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-secondary-white p-4 border-b border-primary-dark-grey flex justify-between items-center">
              <h2 className="text-2xl font-bold text-heading-text-black">{selectedMember.name}'s Details</h2>
              <button onClick={closeModal} className="text-2xl font-bold text-text-grey hover:text-red-500">&times;</button>
            </div>

            {detailsLoading ? (
              <div className="p-8 text-center">Loading details...</div>
            ) : memberDetails ? (
              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-primary-grey p-4 rounded-lg">
                    <p className="font-medium text-heading-text-black">📖 Books Read</p>
                    <p className="text-3xl font-bold text-heading-text-black">{memberDetails.booksRead}</p>
                  </div>
                  <div className="bg-primary-grey p-4 rounded-lg">
                    <p className="font-medium text-heading-text-black">💸 Pending Fines</p>
                    <p className="text-3xl font-bold text-red-600">₹{memberDetails.pendingFines}</p>
                  </div>
                </div>
                {/* History */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-heading-text-black">📚 Borrowing History</h3>
                  <ul className="space-y-4 text-sm">
                    {memberDetails.history.length === 0 ? (
                      <li className="text-text-grey">No borrowing history found.</li>
                    ) : (
                      memberDetails.history.map((record, index) => (
                        <li key={index} className="border-b border-primary-dark-grey pb-3 last:border-b-0 space-y-1">
                          <p className='text-text-grey'><strong className='text-heading-text-black font-malayalam'>📘 Book:</strong> {record.books?.title || 'Unknown'}</p>
                          <p className='text-text-grey'><strong className='text-heading-text-black'>📅 Borrowed:</strong> {dayjs(record.borrow_date).format('DD MMM YYYY')}</p>
                          <p className='text-text-grey'><strong className='text-heading-text-black'>✅ Returned:</strong> {record.return_date ? dayjs(record.return_date).format('DD MMM YYYY') : 'Not Returned'}</p>
                          {record.fine > 0 && (
                            <p className={record.fine_paid ? 'text-green-600' : 'text-red-600'}>
                              💰 Fine: ₹{record.fine} {record.fine_paid ? '(Paid)' : '(Unpaid)'}
                            </p>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            ) : (
                <div className="p-8 text-center text-red-500">Could not load member details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}