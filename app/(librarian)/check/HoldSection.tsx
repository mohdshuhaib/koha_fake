'use client'

import { useState } from 'react'
import HoldForm from './HoldForm'
import HeldBooksList from './HeldBooksList'
import clsx from 'classnames'

export default function HoldSection() {
  const [subTab, setSubTab] = useState<'hold' | 'held'>('hold')

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto">
        <div className="inline-flex min-w-full sm:min-w-0 rounded-2xl bg-primary-grey p-1 border border-primary-dark-grey">
          <button
            onClick={() => setSubTab('hold')}
            className={clsx(
              'flex-1 whitespace-nowrap rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold transition-all duration-200',
              subTab === 'hold'
                ? 'bg-white text-dark-green shadow-sm'
                : 'text-text-grey hover:text-heading-text-black'
            )}
          >
            Place a Hold
          </button>

          <button
            onClick={() => setSubTab('held')}
            className={clsx(
              'flex-1 whitespace-nowrap rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold transition-all duration-200',
              subTab === 'held'
                ? 'bg-white text-dark-green shadow-sm'
                : 'text-text-grey hover:text-heading-text-black'
            )}
          >
            View Held Books
          </button>
        </div>
      </div>

      <div className="rounded-2xl">
        {subTab === 'hold' ? <HoldForm /> : <HeldBooksList />}
      </div>
    </div>
  )
}