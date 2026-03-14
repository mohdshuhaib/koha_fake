'use client'

import { Users, SearchCheck, Library } from 'lucide-react'
import PatronsStatCard from './PatronsStatCard'

export default function PatronsHeader({
  totalMembers,
  filteredCount,
}: {
  totalMembers: number
  filteredCount: number
}) {
  return (
    <section className="rounded-[2rem] border border-primary-dark-grey/70 bg-secondary-white/90 shadow-2xl backdrop-blur-sm">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.3fr_0.9fr] lg:p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-primary-grey px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-grey">
            <Library size={16} className="text-dark-green" />
            Library Patrons
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-heading-text-black sm:text-4xl">
              Library Members
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-grey sm:text-base">
              Browse and search all registered library patrons by name, category,
              barcode, or batch in a clean responsive view.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <PatronsStatCard
            icon={<Users size={18} />}
            label="Total Patrons"
            value={String(totalMembers)}
          />
          <PatronsStatCard
            icon={<SearchCheck size={18} />}
            label="Visible Results"
            value={String(filteredCount)}
          />
        </div>
      </div>
    </section>
  )
}