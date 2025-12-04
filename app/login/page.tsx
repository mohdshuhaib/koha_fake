'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'
import Link from 'next/link'
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import clsx from 'classnames'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  // State to toggle between login and password reset views
  const [view, setView] = useState<'login' | 'reset'>('login')

  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  // --- Logic (Updated for Developer Role) ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Redirect based on role
        const role = session.user.user_metadata?.role || 'member'
        if (role === 'developer') {
            router.replace('/developer/dashboard-dev')
        } else if (role === 'librarian') {
            router.replace('/dashboard')
        } else {
            router.replace('/member/dashboard-mem')
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      // Check role immediately after login to redirect correctly
      const role = data.user?.user_metadata?.role || 'member'
      if (role === 'developer') {
        router.push('/developer/dashboard-dev')
      } else if (role === 'librarian') {
        router.push('/dashboard')
      } else {
        router.push('/member/dashboard-mem')
      }
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${location.origin}/reset-password`,
    })
    if (error) {
      setResetMsg({ type: 'error', text: error.message })
    } else {
      setResetMsg({ type: 'success', text: 'Password reset email sent. Check your inbox.' })
    }
    setResetLoading(false)
  }

  if (checkingSession) return <Loading />

  // --- REDESIGNED JSX ---
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-grey px-4">
      <div className="w-full max-w-md bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-2xl p-8">
        {view === 'login' ? (
          // --- Login View ---
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-heading-text-black font-heading tracking-wider">Librarian Login</h1>
              <p className="text-sm text-sub-heading-text-grey mt-1">Welcome back! Please sign in.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 rounded-lg text-sm bg-red-100 text-red-800">
                <AlertCircle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text-grey mb-1">Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-text-grey" /></div>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pl-10 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" placeholder="you@domain.com" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-text-grey mb-1">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="h-5 w-5 text-text-grey" /></div>
                  <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pl-10 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" placeholder="••••••••" />
                </div>
                <button type="button" onClick={() => setView('reset')} className="text-sm text-link-text-green hover:underline cursor-pointer mt-2 text-left w-full">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-button-yellow text-button-text-black font-bold hover:bg-yellow-500 transition-colors">
                <LogIn size={18} /> Sign In
              </button>
            </form>
          </div>
        ) : (
          // --- Password Reset View ---
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-heading-text-black font-heading tracking-wider">Reset Password</h1>
              <p className="text-sm text-sub-heading-text-grey mt-1">Enter your email to receive a reset link.</p>
            </div>

            {resetMsg && (
              <div className={clsx("flex items-center gap-3 p-3 rounded-lg text-sm", resetMsg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                {resetMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <span className="font-medium">{resetMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
               <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-text-grey mb-1">Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-text-grey" /></div>
                  <input id="reset-email" type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full p-3 pl-10 rounded-lg bg-primary-grey border border-primary-dark-grey text-text-grey placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-dark-green" placeholder="you@domain.com" />
                </div>
              </div>
              <button type="submit" disabled={resetLoading} className="w-full py-3 rounded-lg bg-button-yellow text-button-text-black font-bold hover:bg-yellow-500 transition-colors disabled:opacity-70">
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <button onClick={() => setView('login')} className="text-sm text-link-text-green hover:underline cursor-pointer text-center w-full">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </main>
  )
}