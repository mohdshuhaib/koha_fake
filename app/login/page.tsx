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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
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

  if (checkingSession) return <Loading />

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-secondary to-sidekick px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 bg-primary/80 rounded-xl shadow-lg p-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sidekick">Librarian Login</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Please sign in.</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-100 px-4 py-2 rounded">{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sidekick"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sidekick"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-sidekick text-black font-semibold hover:bg-sidekick-dark transition-colors"
        >
          Sign In
        </button>
      </form>
    </main>
  )
}
