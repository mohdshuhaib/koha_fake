'use client'

export default function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="rounded-2xl border border-primary-dark-grey bg-secondary-white px-4 py-3">
      <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-text-grey">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 cursor-pointer w-full rounded-xl bg-transparent text-sm font-medium text-heading-text-black focus:outline-none sm:text-base"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}