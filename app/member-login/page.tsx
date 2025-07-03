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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-sidekick-dark">📘 Member Login</h2>
          <p className="text-sm text-white/70 mt-1">Access your library dashboard</p>
        </div>

        {error && (
          <p
            className="text-red-600 text-sm bg-red-100/90 px-4 py-2 rounded shadow"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="barcode" className="block text-sm font-medium text-white/90">
            Barcode
          </label>
          <input
            id="barcode"
            type="text"
            placeholder="Enter your barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="mt-1 w-full px-4 py-2 bg-white/5 text-white border border-white/20 rounded-md shadow-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sidekick-dark transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-sidekick-dark text-black font-semibold hover:bg-white transition-colors"
        >
          Login
        </button>
      </form>
    </main>
  )
}
