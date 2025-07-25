'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setError(error.message)

    setSuccess('✅ Password updated successfully! Redirecting...')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-grey px-4">
      <form
        onSubmit={handleUpdatePassword}
        className="w-full max-w-md space-y-6  bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-8"
      >
        <h1 className="text-xl font-bold text-center font-heading">🔐 Set New Password</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="space-y-3">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-button-yellow text-black rounded-md hover:bg-yellow-600 transition"
        >
          Update Password
        </button>
      </form>
    </main>
  )
}
