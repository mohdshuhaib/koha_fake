'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase' // Corrected import path
import { Menu, X, ChevronDown } from 'lucide-react'
import clsx from 'classnames'

// Defines the structure for a navigation item
interface NavItemType {
  href?: string
  label: string
  children?: NavItemType[]
}

export default function Navbar() {
  // Replaced Next.js hooks with standard browser window properties
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<'member' | 'librarian' | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    // Replaced router.push with standard window navigation
    window.location.href = '/'
    setIsMenuOpen(false)
  }

  const navItems: NavItemType[] = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/patrons', label: 'Members' },
    ...(isLoggedIn ? [
      {
        href: role === 'librarian' ? '/dashboard' : '/member/dashboard-mem',
        label: 'Dashboard'
      },
    ] : []),
    ...(role === 'librarian' ? [
      { href: '/check', label: 'Check In / Out' },
      {
        label: 'Management',
        children: [
          { href: '/books', label: 'Books' },
          { href: '/members', label: 'Patrons' },
          { href: '/fines', label: 'Fines' },
          { href: '/periodicals', label: 'Periodicals' },
        ],
      },
      { href: '/backup', label: 'Backup' },
      { href: '/history', label: 'Stats' },
    ] : [])
  ];

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-green-900 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="text-xl font-bold uppercase tracking-wider text-white">
              PMSA Library
            </a>

            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <NavItem key={item.label} item={item} pathname={pathname} />
              ))}
              <AuthButton isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 h-screen bg-gray-900/95 p-4 backdrop-blur-lg md:hidden">
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <NavItem key={item.label} item={item} pathname={pathname} isMobile onLinkClick={() => setIsMenuOpen(false)} />
            ))}
            <div className="border-t border-gray-700 pt-4">
              <AuthButton isLoggedIn={isLoggedIn} handleLogout={handleLogout} isMobile />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavItem({ item, pathname, isMobile = false, onLinkClick }: { item: NavItemType; pathname: string; isMobile?: boolean; onLinkClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = item.href ? pathname === item.href : false;

  if (item.children) {
    return (
      <div className="relative" onMouseEnter={() => !isMobile && setIsOpen(true)} onMouseLeave={() => !isMobile && setIsOpen(false)}>
        <button onClick={() => isMobile && setIsOpen(!isOpen)} className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-100 hover:bg-dark-green hover:text-white">
          {item.label}
          <ChevronDown size={16} className={clsx("transition-transform", { "rotate-180": isOpen })} />
        </button>
        {isOpen && (
          <div
            className={clsx(
              "flex flex-col space-y-1",
              !isMobile && "absolute left-0 top-full z-10 w-48 rounded-md bg-light-green p-2 shadow-lg"
            )}
          >
            {item.children.map(child => (
              <a
                key={child.href}
                href={child.href!}
                onClick={onLinkClick}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  pathname === child.href
                    ? "bg-dark-green text-white"
                    : "text-gray-100 hover:bg-dark-green hover:text-white"
                )}
              >
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href!}
      onClick={onLinkClick}
      className={clsx(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-dark-green text-white" : "text-gray-100 hover:bg-dark-green hover:text-white"
      )}
    >
      {item.label}
    </a>
  )
}

function AuthButton({ isLoggedIn, handleLogout, isMobile = false }: { isLoggedIn: boolean; handleLogout: () => void; isMobile?: boolean }) {
  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className={clsx(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "bg-red-600 text-white hover:bg-red-700",
          { "w-full text-center": isMobile }
        )}
      >
        Logout
      </button>
    );
  }
  return (
    <a
      href="/login"
      className={clsx(
        "rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "bg-dark-green text-white hover:bg-dark-green",
        { "w-full text-center block": isMobile }
      )}
    >
      Login
    </a>
  );
}
