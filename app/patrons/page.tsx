'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import { Search, User, UserSquare, Barcode, Calendar } from 'lucide-react'

// Data type remains the same
type Member = {
  id: string
  name: string
  category: string
  barcode: string
  batch: string
}

export default function MemberTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')

  // Data fetching and filtering logic is unchanged
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data) {
        setMembers(data)
        setFilteredMembers(data) // Initialize with all members
      }
      setLoading(false)
    }

    fetchMembers()
  }, [])

  useEffect(() => {
    const query = search.toLowerCase()
    const results = members.filter((m) =>
      m.name.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query) ||
      m.barcode.toLowerCase().includes(query) ||
      m.batch.toLowerCase().includes(query)
    )
    setFilteredMembers(results)
  }, [search, members])

  if (loading) return <div className="p-16"><Loading /></div>

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4">
      <div className="max-w-7xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-heading-text-black uppercase text-center tracking-wider">
          Library Patrons
        </h1>

        {/* Modern search bar, consistent with Catalog page */}
        <div className="relative mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-text-grey" />
          </div>
          <input
            type="text"
            placeholder="Search by name, category, barcode or batch"
            className="w-full p-3 pl-12 rounded-lg bg-secondary-white border border-dark-green text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredMembers.length === 0 && !loading ? (
          <p className="py-16 text-text-grey text-center">No patrons found.</p>
        ) : (
          <>
            {/* Desktop Table (Visible on medium screens and up) */}
            <div className="hidden md:block overflow-x-auto">
              <div className="border border-primary-dark-grey rounded-lg shadow-inner">
                <table className="min-w-full text-sm text-left">
                  <thead className="sticky top-0 z-10 bg-secondary-light-black text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Barcode</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="border-b border-primary-dark-grey last:border-b-0 hover:bg-primary-grey transition">
                        <td className="px-4 py-3 font-semibold text-heading-text-black">{m.name}</td>
                        <td className="px-4 py-3 text-text-grey">{m.category}</td>
                        <td className="px-4 py-3 text-text-grey">{m.barcode}</td>
                        <td className="px-4 py-3 text-text-grey">{m.batch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Visible on small screens) */}
            <div className="block md:hidden space-y-4">
              {filteredMembers.map((m) => (
                <div key={m.id} className="bg-primary-grey border border-primary-dark-grey rounded-lg p-4 shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-heading-text-black">{m.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm text-text-grey">
                    <div className="flex items-center gap-2">
                      <UserSquare size={14} /> <span>{m.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Barcode size={14} /> <span>{m.barcode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> <span>{m.batch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}