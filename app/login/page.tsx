'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const role = session.user.user_metadata?.role || 'member'

        if (role === 'librarian') {
          router.replace('/dashboard') // Librarian dashboard
        } else {
          router.replace('/member/dashboard-mem') // Redirect member to their dashboard
        }
      } else {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    router.push('/dashboard')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${location.origin}/reset-password`,
    })
    if (error) {
      setResetMsg('❌ ' + error.message)
    } else {
      setResetMsg('📧 Password reset email sent. Check your inbox.')
    }
    setResetLoading(false)
  }

  if (checkingSession) return <Loading />

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-grey px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6  bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-heading-text-black">🔐 Librarian Login</h1>
          <p className="text-sm text-sub-heading-text-grey mt-1">Welcome back! Please sign in.</p>
        </div>

        {error && (
          <p
            className="text-red-600 text-sm bg-red-100/90 px-4 py-2 rounded shadow"
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-grey">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-secondary-white text-text-grey border border-primary-dark-grey rounded-md shadow-sm placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-grey">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-secondary-white text-text-grey border border-primary-dark-grey rounded-md shadow-sm placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-primary-dark-grey transition "
              placeholder="••••••••"
            />
            <p
              onClick={() => setShowReset(true)}
              className="text-sm text-blue-600 hover:underline cursor-pointer mt-2"
            >
              Forgot password?
            </p>

          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-button-yellow text-button-text-black font-semibold hover:bg-primary-dark-grey transition-colors"
        >
          Sign In
        </button>
      </form>
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">🔑 Reset Password</h2>
            <p className="text-sm text-gray-600">
              Enter your registered email to receive a password reset link.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                placeholder="you@domain.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="w-full py-2 bg-button-yellow text-black rounded-md hover:bg-yellow-600 transition"
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {resetMsg && <p className="text-sm mt-2 text-gray-700">{resetMsg}</p>}

            <button
              onClick={() => setShowReset(false)}
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
