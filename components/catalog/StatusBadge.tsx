'use client'

import clsx from 'classnames'

export default function StatusBadge({
  status,
  heldBy,
  borrowedBy,
}: {
  status: string
  heldBy?: string
  borrowedBy?: string
}) {
  const baseClasses =
    'inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-bold'

  switch (status) {
    case 'available':
      return (
        <span className={clsx(baseClasses, 'bg-green-100 text-green-800')}>
          Available
        </span>
      )

    case 'held':
      return (
        <span
          className={clsx(baseClasses, 'bg-yellow-100 text-yellow-800')}
          title={heldBy ? `Held by ${heldBy}` : 'Held'}
        >
          Held{heldBy ? ` • ${heldBy}` : ''}
        </span>
      )

    case 'borrowed':
      return (
        <span
          className={clsx(baseClasses, 'bg-red-100 text-red-800')}
          title={borrowedBy ? `Checked out to ${borrowedBy}` : 'Checked out'}
        >
          Checked Out{borrowedBy ? ` • ${borrowedBy}` : ''}
        </span>
      )

    default:
      return null
  }
}