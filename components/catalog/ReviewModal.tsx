'use client'

import { X, Star, Loader2 } from 'lucide-react'
import clsx from 'classnames'
import type { Book, ReviewFormState } from '@/app/catalog/page'

export default function ReviewModal({
  book,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
}: {
  book: Book
  form: ReviewFormState
  setForm: React.Dispatch<React.SetStateAction<ReviewFormState>>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-primary-dark-grey px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-heading-text-black sm:text-2xl">
              Review this Book
            </h2>
            <p className="mt-1 break-words text-sm text-text-grey">{book.title}</p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-primary-grey"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(90dvh-72px)] overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading-text-black">
                  Your Name
                </label>
                <input
                  type="text"
                  value={form.reviewer_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reviewer_name: e.target.value }))
                  }
                  placeholder="Enter your name"
                  className="h-12 w-full rounded-xl border border-primary-dark-grey px-4 text-sm text-heading-text-black focus:outline-none focus:ring-2 focus:ring-dark-green sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-heading-text-black">
                  Job / Student / Role
                </label>
                <input
                  type="text"
                  value={form.reviewer_role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reviewer_role: e.target.value }))
                  }
                  placeholder="Student / Teacher / Staff / etc"
                  className="h-12 w-full rounded-xl border border-primary-dark-grey px-4 text-sm text-heading-text-black focus:outline-none focus:ring-2 focus:ring-dark-green sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-heading-text-black">
                Your Rating
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const current = i + 1
                  return (
                    <button
                      type="button"
                      key={current}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          rating: current,
                        }))
                      }
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={30}
                        className={clsx(
                          form.rating >= current
                            ? 'fill-yellow-400 text-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  )
                })}
                <span className="ml-1 text-sm text-text-grey">
                  {form.rating > 0 ? `${form.rating} out of 5` : 'Select rating'}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-heading-text-black">
                Comment
              </label>
              <textarea
                value={form.comment}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={5}
                placeholder="Write your opinion about this book..."
                className="w-full rounded-xl border border-primary-dark-grey px-4 py-3 text-sm text-heading-text-black focus:outline-none focus:ring-2 focus:ring-dark-green resize-none sm:text-base"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary-dark-grey px-5 py-3 font-semibold text-heading-text-black transition hover:bg-primary-grey"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dark-green px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}