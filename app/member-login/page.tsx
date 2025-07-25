'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MemberLogin() {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const role = session.user.user_metadata?.role || 'member'

      if (role === 'librarian') {
        router.replace('/dashboard') // Redirect librarian away from member login
      } else {
        router.replace('/member/dashboard-mem') // Member dashboard
      }
    } else {
      setCheckingSession(false)
    }
  }

  checkSession()
}, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const paddedPassword = barcode.padEnd(6, '0') // pad to meet Supabase requirement
    const email = `${barcode}@member.pmsa`        // fake but consistent email

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: paddedPassword,
    })

    if (loginError) {
      console.error('Login error:', loginError.message)
      setError('Invalid barcode or password.')
    } else {
      router.push('/member/dashboard-mem')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-grey px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 backdrop-blur-lg bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-heading-text-black font-heading">📘 Member Login</h2>
          <p className="text-sm text-sub-heading-text-grey mt-1">Access your library dashboard</p>
        </div>

        {error && (
          <p
            className="text-red-600 text-sm bg-red-100/90 px-4 py-2 rounded shadow"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="barcode" className="block text-sm font-medium text-text-grey">
            Barcode
          </label>
          <input
            id="barcode"
            type="text"
            placeholder="Enter your barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="mt-1 w-full px-4 py-2 bg-secondary-white text-text-grey border border-primary-dark-grey rounded-md shadow-sm placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-button-yellow text-button-text-black font-semibold hover:bg-primary-dark-grey transition-colors"
        >
          Login
        </button>
      </form>
    </main>
  )
}
