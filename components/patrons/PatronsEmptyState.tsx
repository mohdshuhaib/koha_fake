'use client'

import { SearchX } from 'lucide-react'

export default function PatronsEmptyState({
  search,
}: {
  search: string
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-primary-dark-grey bg-primary-grey/60 px-4 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-text-grey shadow-sm">
          <SearchX size={24} />
        </div>
        <p className="mt-4 text-lg font-semibold text-heading-text-black">
          No patrons found
        </p>
        <p className="mt-2 text-sm text-text-grey">
          {search
            ? 'Try a different name, category, barcode, or batch.'
            : 'There are no patrons to display right now.'}
        </p>
      </div>
    </div>
  )
}