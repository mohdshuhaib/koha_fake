'use client'

export default function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.16em] text-text-grey">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-heading-text-black">
        {value}
      </p>
    </div>
  )
}