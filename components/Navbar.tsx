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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })

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
    <nav className="sticky top-0 z-20 w-full bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-700 flex items-center gap-1">
          📚 <span>PMSA Library</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium transition-colors hover:text-blue-600',
                pathname === item.href ? 'text-blue-600' : 'text-gray-700'
              )}
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className={clsx(
                'text-sm font-medium hover:text-blue-600',
                pathname === '/login' ? 'text-blue-600' : 'text-gray-700'
              )}
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-2 bg-white shadow-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                'text-sm font-medium px-2 py-1 rounded hover:bg-blue-50',
                pathname === item.href ? 'text-blue-600' : 'text-gray-700'
              )}
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
              className="text-sm font-medium px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition text-left"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className={clsx(
                'text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded',
                pathname === '/login' ? 'text-blue-600' : 'text-gray-700'
              )}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
