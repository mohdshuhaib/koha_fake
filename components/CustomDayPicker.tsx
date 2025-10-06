'use client'

import { DayPicker, DayPickerProps } from 'react-day-picker'

// This is a reusable, styled calendar component
export function CustomDayPicker(props: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      className="p-3"
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
        day_outside: 'text-text-grey opacity-50',
        day_disabled: 'text-text-grey opacity-50',
        day_range_middle: 'aria-selected:bg-primary-dark-grey aria-selected:text-text-grey',
        day_hidden: 'invisible',
      }}
      {...props}
    />
  )
}
