'use client'

import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'

interface Props {
  dateRange: { from: Date | undefined; to: Date | undefined }
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export default function DateFilter({ dateRange, setDateRange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDateRange({ from: undefined, to: undefined })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-secondary-white border border-primary-dark-grey px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-grey transition w-full md:w-auto"
      >
        <CalendarIcon size={16} className="text-text-grey" />
        <span className="text-heading-text-black">
          {dateRange.from ? (
            <>
              {dayjs(dateRange.from).format('DD MMM YYYY')}
              {dateRange.to ? ` - ${dayjs(dateRange.to).format('DD MMM YYYY')}` : ''}
            </>
          ) : (
            "Filter by Date"
          )}
        </span>
        {dateRange.from && (
          <span onClick={handleReset} className="ml-2 p-1 hover:bg-red-100 hover:text-red-500 rounded-full">
            <X size={14} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-secondary-white border border-primary-dark-grey rounded-xl shadow-2xl p-4">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
            numberOfMonths={1}
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-lg font-bold text-heading-text-black',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-text-grey rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary-dark-grey first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-primary-dark-grey transition-colors',
              day_selected: 'bg-button-yellow text-button-text-black hover:bg-button-yellow focus:bg-button-yellow focus:text-button-text-black font-bold',
              day_today: 'bg-primary-dark-grey text-heading-text-black rounded-full',
            }}
          />
        </div>
      )}
    </div>
  )
}