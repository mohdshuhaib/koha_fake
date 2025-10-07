'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { User, Book, CheckCircle2, AlertCircle, X } from 'lucide-react'
import clsx from 'classnames'

type HeldInfo = {
    bookId: string;
    bookTitle: string;
    holdId: string;
    heldForMemberName: string;
}

export default function CheckOutForm() {
    const [memberBarcode, setMemberBarcode] = useState('')
    const [bookBarcode, setBookBarcode] = useState('')
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)
    const [loading, setLoading] = useState(false)
    const [memberQuery, setMemberQuery] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])

    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false)
    const [heldInfo, setHeldInfo] = useState<HeldInfo | null>(null)

    const memberInputRef = useRef<HTMLInputElement>(null)
    const bookInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { memberInputRef.current?.focus() }, [])

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (memberQuery.trim().length > 1 && memberBarcode === '') fetchMemberSuggestions();
            else setSuggestions([]);
        }, 300)
        return () => clearTimeout(delayDebounce)
    }, [memberQuery, memberBarcode])

    const fetchMemberSuggestions = async () => {
        const { data } = await supabase.from('members').select('name, barcode').ilike('name', `%${memberQuery.trim()}%`).limit(5)
        if (data) setSuggestions(data)
    }

    const handleSelectMember = (member: any) => {
        setMemberBarcode(member.barcode)
        setMemberQuery(`${member.name} (${member.barcode})`)
        setSuggestions([])
        setTimeout(() => bookInputRef.current?.focus(), 100)
    }

    const handleCheckout = async () => {
        if (!memberBarcode || !bookBarcode) return
        setLoading(true)
        setMessage('')
        setIsError(false)

        // --- Step 1: Validate Member ---
        const { data: member, error: memberError } = await supabase.from('members').select('id, name, category').eq('barcode', memberBarcode).single()
        if (memberError || !member) {
            setMessage('Member not found. Please check the name or barcode.')
            setIsError(true)
            resetForm(true)
            return
        }

        // --- ✅ NEW: Step 2: Check for Unpaid Fines ---
        const { count: unpaidFines, error: fineError } = await supabase
            .from('borrow_records')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', member.id)
            .eq('fine_paid', false)
            .gt('fine', 0)

        if (fineError) {
            setMessage('Could not verify member\'s fine status. Please try again.')
            setIsError(true)
            resetForm(true)
            return
        }

        if (unpaidFines && unpaidFines > 0) {
            setMessage(`"${member.name}" has an outstanding fine and cannot borrow new books until it is paid.`)
            setIsError(true)
            resetForm(true) // Reset everything
            return
        }

        // --- Step 3: Validate Book ---
        const { data: book, error: bookError } = await supabase.from('books').select('id, title, status').eq('barcode', bookBarcode).or('status.eq.available,status.eq.held').single()
        if (bookError || !book) {
            setMessage('Book is not available for checkout or barcode is incorrect.')
            setIsError(true)
            resetForm(false)
            return
        }

        // --- Step 4: Handle Held Books ---
        if (book.status === 'held') {
            const { data: holdRecord } = await supabase.from('hold_records').select('id, member:members!inner(name)').eq('book_id', book.id).eq('released', false).single()
            if (holdRecord) {
                 const memberName = Array.isArray(holdRecord.member) ? holdRecord.member[0]?.name : (holdRecord.member as any)?.name;
                 if (memberName) {
                    setHeldInfo({ bookId: book.id, bookTitle: book.title, holdId: holdRecord.id, heldForMemberName: memberName });
                    setIsHoldModalOpen(true);
                    setLoading(false);
                    return;
                }
            }
        }

        // --- Step 5: Proceed with Normal Checkout ---
        await proceedWithCheckout(book.id, book.title, member);
    }

    const proceedWithCheckout = async (bookId: string, bookTitle: string, member: any) => {
        const dueInDays = (member.category === 'teacher' || member.category === 'class') ? 30 : 15
        const dueDate = dayjs().add(dueInDays, 'day').format('YYYY-MM-DD')

        const { error: borrowError } = await supabase.from('borrow_records').insert({ book_id: bookId, member_id: member.id, due_date: dueDate })
        if (borrowError) {
            setMessage('Failed to create borrow record.')
            setIsError(true)
            resetForm(false)
            return
        }
        const { error: updateBookError } = await supabase.from('books').update({ status: 'borrowed' }).eq('id', bookId)
        if (updateBookError) {
            setMessage('Failed to update book status, but record was created.')
            setIsError(true)
            resetForm(false)
            return
        }

        setMessage(`"${bookTitle}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`)
        setIsError(false)
        resetForm(false)
    }

    const handleConfirmHeldCheckout = async () => {
        if (!heldInfo) return;
        setLoading(true)
        setIsHoldModalOpen(false)

        const { data: member, error: memberError } = await supabase.from('members').select('id, name, category').eq('barcode', memberBarcode).single();
        if (memberError || !member) {
            setMessage('Member not found.');
            setIsError(true);
            resetForm(true);
            return;
        }

        const dueInDays = (member.category === 'teacher' || member.category === 'class') ? 30 : 15;
        const dueDate = dayjs().add(dueInDays, 'day').format('YYYY-MM-DD');

        const { error: rpcError } = await supabase.rpc('checkout_held_book', {
            p_book_id: heldInfo.bookId,
            p_member_id: member.id,
            p_due_date: dueDate,
        });

        if (rpcError) {
            setMessage('Failed to process checkout for held book.');
            setIsError(true);
            console.error(rpcError);
        } else {
            setMessage(`Held book "${heldInfo.bookTitle}" issued to ${member.name}. Return by ${dayjs(dueDate).format('DD MMM YYYY')}`);
            setIsError(false);
        }
        resetForm(false);
    }

    const resetForm = (resetMember: boolean) => {
        setBookBarcode('')
        if (resetMember) {
            setMemberBarcode('')
            setMemberQuery('')
        }
        setSuggestions([])
        setLoading(false)
        setHeldInfo(null)
        setIsHoldModalOpen(false)
        if (resetMember) setTimeout(() => memberInputRef.current?.focus(), 100);
        else setTimeout(() => bookInputRef.current?.focus(), 100);
    }

    const clearMemberAndReset = () => {
        resetForm(true);
    }

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold font-heading text-heading-text-black uppercase">Check Out a Book</h2>

                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><User className="h-5 w-5 text-text-grey" /></div>
                    <input
                        ref={memberInputRef}
                        type="text"
                        className="w-full p-3 pl-12 pr-10 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
                        placeholder="Enter member name or scan barcode"
                        value={memberQuery}
                        onChange={(e) => { setMemberQuery(e.target.value); setMemberBarcode(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && suggestions.length === 0 && bookInputRef.current?.focus()}
                        disabled={loading}
                    />
                    {memberQuery && !loading && (
                        <button
                            onClick={clearMemberAndReset}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-grey hover:text-red-500 transition"
                            aria-label="Clear member"
                        >
                            <X size={18} />
                        </button>
                    )}
                    {suggestions.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-secondary-white text-text-grey border border-primary-dark-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((member) => (
                                <li key={member.barcode} onClick={() => handleSelectMember(member)} className="px-4 py-3 hover:bg-primary-dark-grey cursor-pointer transition">
                                    <span className="block text-sm font-medium text-heading-text-black">{member.name}</span>
                                    <span className="block text-xs text-text-grey">{member.barcode}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Book className="h-5 w-5 text-text-grey" /></div>
                    <input ref={bookInputRef} type="text" className="w-full p-3 pl-12 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition" placeholder="Scan book barcode" value={bookBarcode} onChange={(e) => setBookBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheckout()} disabled={loading} />
                </div>
                <button onClick={handleCheckout} disabled={loading || !memberBarcode || !bookBarcode} className="w-full sm:w-auto bg-button-yellow text-button-text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60">
                    {loading ? 'Processing...' : 'Check Out'}
                </button>
                {message && (
                    <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                        {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <span className="font-medium">{message}</span>
                    </div>
                )}
            </div>

            {isHoldModalOpen && heldInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-secondary-white rounded-xl shadow-2xl max-w-md w-full border border-primary-dark-grey">
                        <div className="p-6 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                            <h3 className="mt-4 text-xl font-bold font-heading text-heading-text-black">Book on Hold</h3>
                            <p className="mt-2 text-sm text-text-grey">This book, "{heldInfo.bookTitle}", is currently on hold for <strong className="text-heading-text-black">{heldInfo.heldForMemberName}</strong>. Do you want to proceed with checking it out?</p>
                        </div>
                        <div className="flex justify-end gap-3 bg-primary-grey p-4 rounded-b-xl">
                            <button onClick={() => resetForm(false)} className="px-5 py-2 text-sm font-semibold text-text-grey bg-secondary-white border border-primary-dark-grey rounded-lg hover:bg-primary-dark-grey">Cancel</button>
                            <button onClick={handleConfirmHeldCheckout} className="px-5 py-2 text-sm font-semibold text-white bg-dark-green rounded-lg hover:bg-icon-green">Continue Checkout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
