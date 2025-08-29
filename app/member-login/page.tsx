'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import Link from 'next/link'
import { Barcode, LogIn, AlertCircle } from 'lucide-react'

export default function MemberLogin() {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  // --- Authentication Logic (Unchanged) ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const role = session.user.user_metadata?.role || 'member'
        router.replace(role === 'librarian' ? '/dashboard' : '/member/dashboard-mem')
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Supabase requires a password of at least 6 characters.
    // We pad the barcode to meet this requirement for the member's simple login.
    const paddedPassword = barcode.padEnd(6, '0')
    const email = `${barcode.toLowerCase()}@member.pmsa`

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: paddedPassword,
    })

    if (loginError) {
      setError('Invalid barcode. Please try again.')
    } else {
      router.push('/member/dashboard-mem')
    }
    setLoading(false)
  }

  if (checkingSession) return <Loading />

  // --- REDESIGNED JSX ---
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-grey px-4">
      <div className="w-full max-w-md bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-heading-text-black font-heading tracking-wider">Member Login</h1>
            <p className="text-sm text-sub-heading-text-grey mt-1">Access your library dashboard.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-lg text-sm bg-red-100 text-red-800">
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-semibold text-text-grey mb-1">
                Library Barcode
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Barcode className="h-5 w-5 text-text-grey" />
                </div>
                <input
                  id="barcode"
                  type="text"
                  placeholder="Enter your barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full p-3 pl-10 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-button-yellow text-button-text-black font-bold hover:bg-yellow-500 transition-colors disabled:opacity-70"
            >
              <LogIn size={18} />
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>
        </div>

        {/* --- Librarian Login Link --- */}
        <div className="text-center mt-6 pt-6 border-t border-primary-dark-grey">
          <p className="text-sm text-text-grey">
            Are you a librarian?{' '}
            <Link href="/login" className="font-semibold text-link-text-green hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}