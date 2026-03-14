'use client'

import { Search, Filter } from 'lucide-react'
import FilterSelect from './FilterSelect'

type Option = {
  label: string
  value: string
}

export default function CatalogFilters({
  search,
  setSearch,
  languageFilter,
  setLanguageFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  totalBooks,
  languageOptions,
  statusOptions,
  sortOptions,
}: {
  search: string
  setSearch: (value: string) => void
  languageFilter: string
  setLanguageFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  totalBooks: number
  languageOptions: Option[]
  statusOptions: Option[]
  sortOptions: Option[]
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
            placeholder="Search by title, author, language, call number, barcode, shelf"
            className="h-12 w-full rounded-2xl border border-primary-dark-grey bg-primary-grey pl-12 pr-4 text-sm text-heading-text-black placeholder:text-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green sm:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Language"
            value={languageFilter}
            onChange={setLanguageFilter}
            options={languageOptions}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />

          <FilterSelect
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
          />

          <div className="flex items-center gap-3 rounded-2xl border border-primary-dark-grey bg-primary-grey px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-light-black text-white">
              <Filter size={16} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-grey">
                Results
              </p>
              <p className="text-base font-semibold text-heading-text-black">
                {totalBooks} books found
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}