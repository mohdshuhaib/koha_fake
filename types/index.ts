export type Book = {
  title: string
  barcode: string
  author?: string
  pages?: number | null
  shelf_location?: string
}

export type Member = {
  id: string
  name: string
  barcode: string
  batch: string
  category: string
}

export type HistoryRecord = {
  id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  fine: number
  fine_paid: boolean
  member_id: string
  members: { name: string; batch: string } | null
  books: Book | null
}

export type RankedItem = {
  name: string
  count: number
  totalPages?: number
}