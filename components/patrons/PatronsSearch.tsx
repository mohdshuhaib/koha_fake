'use client'

import { Search } from 'lucide-react'

export default function PatronsSearch({
  search,
  setSearch,
  totalMembers,
}: {
  search: string
  setSearch: (value: string) => void
  totalMembers: number
}) {
  return (
    <section className="rounded-[2rem] border border-primary-dark-grey/70 bg-secondary-white/90 p-4 shadow-xl sm:p-5">
      <div className="space-y-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-text-grey" />
          </div>
          <input
            type="text"
            placeholder="Search by name, category, barcode or batch"
            className="h-12 w-full rounded-2xl border border-primary-dark-grey bg-primary-grey pl-12 pr-4 text-sm text-heading-text-black placeholder:text-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green sm:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-primary-dark-grey bg-primary-grey px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-grey">
            Results
          </p>
          <p className="text-base font-semibold text-heading-text-black">
            {totalMembers} patron{totalMembers === 1 ? '' : 's'} found
          </p>
        </div>
      </div>
    </section>
  )
}