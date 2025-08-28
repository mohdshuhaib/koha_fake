'use client'

import { useState } from 'react'
import HoldForm from './HoldForm'
import HeldBooksList from './HeldBooksList'
import clsx from 'classnames'

export default function HoldSection() {
  const [subTab, setSubTab] = useState<'hold' | 'held'>('hold')

  return (
    <div>
      <div className="flex border-b border-primary-dark-grey mb-6">
        <button onClick={() => setSubTab('hold')} className={clsx('px-6 py-3 font-bold', subTab === 'hold' ? 'border-b-2 border-dark-green text-dark-green' : 'text-text-grey')}>Place a Hold</button>
        <button onClick={() => setSubTab('held')} className={clsx('px-6 py-3 font-bold', subTab === 'held' ? 'border-b-2 border-dark-green text-dark-green' : 'text-text-grey')}>View Held Books</button>
      </div>

      {subTab === 'hold' ? <HoldForm /> : <HeldBooksList />}
    </div>
  )
}