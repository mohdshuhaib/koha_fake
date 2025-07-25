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
    router.push('/')
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/patrons', label: 'Members' },
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
            { href: '/backup', label: 'Backup' },
          ]
          : []),
      ]
      : []),
  ]

  return (
    <nav
      className="fixed top-0 z-50 w-full backdrop-blur-md bg-dark-green border-b border-light-green shadow-md"
    >

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-heading font-bold text-white flex items-center gap-2">
          📚 <span>PMSA Library</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'text-sm font-medium transition text-white',
                pathname === item.href ? 'bg-icon-green border px-4 py-2 rounded-full border-none' : 'text-white'
              )}

            >
              {item.label}
            </Link>
          ))}

          {role === 'librarian' && (
            isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-sidetext-sidekick-dark text-black hover:bg-[#000000] transition"
              >
                Login
              </Link>
            )
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu Animation */}

        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 pt-2 bg-white/10 backdrop-blur-md border-t border-white/20"
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    'block text-sm font-medium px-4 py-2 rounded-md transition',
                    pathname === item.href
                      ? 'bg-white/20 text-sidekick-dark'
                      : 'text-white hover:bg-white/10'
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
                    className="block w-full text-center text-sm font-medium px-4 py-2 rounded-full bg-sidetext-sidekick-dark text-black hover:bg-sidetext-sidekick-dark-dark transition"
                  >
                    Login
                  </Link>
                )
              )}
            </div>
          </div>
        )}
    </nav>
  )
}
