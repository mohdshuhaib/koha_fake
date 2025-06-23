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

  if (loading) return <Loading/>
  if (members.length === 0) return <p>No members found.</p>

  return (
    <div className="mt-6 overflow-auto rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Available Patrons</h1>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Barcode</th>
            <th className="p-2 border">Batch</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="p-2 border">{m.name}</td>
              <td className="p-2 border">{m.category}</td>
              <td className="p-2 border">{m.barcode}</td>
              <td className="p-2 border">{m.batch}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
