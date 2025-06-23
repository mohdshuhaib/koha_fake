'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<'member' | 'librarian' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const getSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (user) {
        setIsLoggedIn(true)
        const rawRole = user.user_metadata?.role
        setRole(rawRole === 'librarian' ? 'librarian' : 'member')
      } else {
        setIsLoggedIn(false)
        setRole(null)
      }
    }

    getSessionAndRole()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getSessionAndRole()
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Catalog' },
    ...(isLoggedIn
      ? [
        {
          href: role === 'librarian' ? '/dashboard' : '/member/dashboard-mem',
          label: 'Dashboard',
        },
        ...(role === 'librarian'
          ? [
            { href: '/check', label: 'Check In / Out' },
            { href: '/books', label: 'Add Book' },
            { href: '/members', label: 'Add Patron' },
            { href: '/fines', label: 'Fines' },
            { href: '/history', label: 'Stats' },
          ]
          : []),
      ]
      : []),
  ]

  return (
    <nav className="sticky top-0 z-30 w-full bg-primary border-b border-sidekick shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-sidekick flex items-center gap-2"
        >
          📚 <span>PMSA Library</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium hover:text-sidekick transition',
                pathname === item.href ? 'text-sidekick' : 'text-white/90'
              )}
            >
              {item.label}
            </Link>
          ))}

          {role === 'librarian' && (
            isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-sidekick text-black hover:bg-sidekick-dark transition"
              >
                Login
              </Link>
            )
          )}

        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-2 bg-white border-t border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                'block text-sm font-medium px-3 py-2 rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-800 hover:bg-gray-100'
              )}
            >
              {item.label}
            </Link>
          ))}

          {role === 'librarian' && (
            isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout()
                  setMenuOpen(false)
                }}
                className="w-full text-sm font-medium px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center text-sm font-medium px-4 py-2 rounded-full bg-sidekick text-black hover:bg-sidekick-dark transition"
              >
                Login
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  )
}
