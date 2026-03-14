'use client'

import { DayPicker, DayPickerProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'classnames'

export function CustomDayPicker({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={clsx('rdp-root flex justify-center p-3 sm:p-4', className)}
      components={{
        Chevron: ({ orientation, className }) =>
          orientation === 'left' ? (
            <ChevronLeft className={clsx('h-4 w-4', className)} />
          ) : (
            <ChevronRight className={clsx('h-4 w-4', className)} />
          ),
      }}
      classNames={{
        root: 'w-full',

        months: 'flex justify-center',
        month: 'inline-block space-y-4',

        month_caption: 'relative mx-auto flex w-fit min-w-[280px] items-center justify-center pt-1',
        caption_label: 'px-10 text-base sm:text-lg font-bold text-heading-text-black',

        nav: 'contents',

        button_previous:
          'absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary-dark-grey bg-white text-heading-text-black hover:bg-primary-grey transition',
        button_next:
          'absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary-dark-grey bg-white text-heading-text-black hover:bg-primary-grey transition',

        month_grid: 'mx-auto border-collapse',
        weekdays: 'flex',
        weekday:
          'flex h-10 w-10 items-center justify-center text-[0.8rem] font-medium text-text-grey',
        week: 'mt-2 flex w-full',

        day: 'relative h-10 w-10 p-0 text-center',
        day_button:
          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-heading-text-black hover:bg-primary-dark-grey transition',

        selected:
          'bg-button-yellow text-button-text-black font-bold hover:bg-button-yellow',
        today:
          'border border-dark-green text-heading-text-black font-semibold',
        outside: 'text-text-grey opacity-40',
        disabled: 'text-text-grey opacity-40 cursor-not-allowed',
        hidden: 'invisible',

        range_middle: 'bg-primary-dark-grey text-heading-text-black rounded-none',
        range_start: 'bg-button-yellow text-button-text-black rounded-full',
        range_end: 'bg-button-yellow text-button-text-black rounded-full',

        chevron: 'h-4 w-4 text-heading-text-black',

        ...classNames,
      }}
      {...props}
    />
  )
}