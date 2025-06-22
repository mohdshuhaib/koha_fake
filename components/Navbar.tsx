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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })

    // Listen to auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
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
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/check', label: 'Check In / Out' },
          { href: '/books', label: 'Add Book' },
          { href: '/members', label: 'Add Patron' },
          { href: '/fines', label: 'Fines' },
        ]
      : []),
  ]

  return (
    <nav className="p-4 shadow bg-white">
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">📚 Library</div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium',
                pathname === item.href ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className={clsx(
                'text-sm font-medium',
                pathname === '/login' ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium',
                pathname === item.href ? 'text-blue-600' : 'text-gray-600'
              )}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={() => {
                handleLogout()
                setMenuOpen(false)
              }}
              className="text-sm text-red-600 text-left"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className={clsx(
                'text-sm font-medium',
                pathname === '/login' ? 'text-blue-600' : 'text-gray-600'
              )}
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
