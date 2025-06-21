'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
        ]
      : []),
  ]

  return (
    <nav className="p-4 shadow bg-white flex justify-between items-center">
      <div className="flex gap-4">
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
      </div>

      <div>
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
    </nav>
  )
}
