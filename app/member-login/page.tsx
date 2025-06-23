'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MemberLogin() {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-sidekick px-4">
      <form
        onSubmit={handleLogin}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-sidekick">📘 Member Login</h2>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Enter your barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sidekick"
          required
        />

        <button
          type="submit"
          className="w-full bg-sidekick text-black font-semibold py-2 rounded-md hover:bg-sidekick-dark transition"
        >
          Login
        </button>
      </form>
    </div>
  )
}
