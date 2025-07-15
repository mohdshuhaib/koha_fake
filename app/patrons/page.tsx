'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'

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

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data) setMembers(data)
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

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-primary-grey pt-24 px-4">
      <div
        className="max-w-6xl mx-auto bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-6 md:p-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-heading-text-black text-center">
          🧑‍🤝‍🧑 Available Patrons
        </h1>

        <input
          type="text"
          placeholder="Search by name, category, barcode or batch"
          className="w-full p-3 mb-6 rounded-md bg-secondary-white border border-dark-green text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredMembers.length === 0 ? (
          <p className="text-text-grey text-center">No patrons found.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto">
              <div className="max-h-[65vh] overflow-y-auto rounded-md border border-primary-dark-grey shadow-inner custom-scroll">
                <table className="min-w-full text-sm text-left">
                  <thead className="sticky top-0 z-10 bg-secondary-light-black backdrop-blur-sm text-white border-b border-primary-dark-grey">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Barcode</th>
                      <th className="px-4 py-3">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="border-t border-primary-dark-grey hover:bg-primary-dark-grey transition">
                        <td className="px-4 py-3">{m.name}</td>
                        <td className="px-4 py-3">{m.category}</td>
                        <td className="px-4 py-3">{m.barcode}</td>
                        <td className="px-4 py-3">{m.batch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
      )
}
