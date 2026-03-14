'use client'

export default function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-primary-dark-grey bg-primary-grey px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-green text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-grey">
            {label}
          </p>
          <p className="truncate text-base font-semibold text-heading-text-black">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}