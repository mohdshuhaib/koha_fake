'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Menu, X, ChevronDown, Code } from 'lucide-react'
import clsx from 'classnames'

interface NavItemType {
  href?: string
  label: string
  icon?: React.ReactNode
  children?: NavItemType[]
}

export default function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<'member' | 'librarian' | 'developer' | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const getSessionAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user

      if (user) {
        setIsLoggedIn(true)
        const rawRole = user.user_metadata?.role

        if (rawRole === 'developer') {
          setRole('developer')
        } else if (rawRole === 'librarian') {
          setRole('librarian')
        } else {
          setRole('member')
        }
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

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
    setIsMenuOpen(false)
  }

  const navItems: NavItemType[] = useMemo(() => [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/patrons', label: 'Members' },

    ...(isLoggedIn ? [
      ...(role === 'developer'
        ? [
            {
              href: '/developer/dashboard-dev',
              label: 'Dev Console',
              icon: <Code size={16} className="shrink-0" />,
            },
          ]
        : []),

      ...(role === 'librarian'
        ? [{ href: '/dashboard', label: 'Dashboard' }]
        : []),

      ...(role === 'member'
        ? [{ href: '/member/dashboard-mem', label: 'Dashboard' }]
        : []),
    ] : []),

    ...(role === 'librarian'
      ? [
          { href: '/check', label: 'Check In / Out' },
          {
            label: 'Management',
            children: [
              { href: '/books', label: 'Books' },
              { href: '/members', label: 'Patrons' },
              { href: '/fines', label: 'Fines' },
              { href: '/periodicals', label: 'Periodicals' },
              { href: '/dev-support', label: 'System Support' },
            ],
          },
          { href: '/backup', label: 'Backup' },
          { href: '/history', label: 'Stats' },
        ]
      : []),
  ], [isLoggedIn, role])

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-green-new/95 backdrop-blur-xl supports-[backdrop-filter]:bg-green-new/85">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link
              href="/"
              className="min-w-0 truncate text-base font-bold uppercase tracking-[0.18em] text-white sm:text-lg"
            >
              PMSA Library
            </Link>

            <div className="hidden items-center gap-1 lg:gap-2 md:flex">
              {navItems.map((item) => (
                <NavItem key={item.label} item={item} pathname={pathname} />
              ))}
              <div className="ml-2">
                <AuthButton isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
              </div>
            </div>

            <button
              type="button"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden',
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        className={clsx(
          'fixed right-0 top-16 z-50 h-[calc(100dvh-4rem)] w-full max-w-sm transform border-l border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 md:hidden',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Navigation
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                pathname={pathname}
                isMobile
                onLinkClick={() => setIsMenuOpen(false)}
              />
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <AuthButton
              isLoggedIn={isLoggedIn}
              handleLogout={handleLogout}
              isMobile
            />
          </div>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  item,
  pathname,
  isMobile = false,
  onLinkClick,
}: {
  item: NavItemType
  pathname: string
  isMobile?: boolean
  onLinkClick?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const isActive =
    item.href === pathname || item.children?.some((child) => child.href === pathname)

  if (item.children) {
    return (
      <div
        className="relative"
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={clsx(
            'flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition',
            isMobile ? 'min-h-11' : '',
            isActive
              ? 'bg-dark-green text-white shadow-sm'
              : 'text-gray-100 hover:bg-white/10 hover:text-white'
          )}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          <ChevronDown
            size={16}
            className={clsx('shrink-0 transition-transform', {
              'rotate-180': isOpen,
            })}
          />
        </button>

        {isOpen && (
          <div
            className={clsx(
              'mt-2 space-y-1',
              !isMobile &&
                'absolute left-0 top-full mt-2 min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl'
            )}
          >
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href!}
                onClick={onLinkClick}
                className={clsx(
                  'block rounded-xl px-4 py-3 text-sm font-medium transition',
                  pathname === child.href
                    ? 'bg-dark-green text-white'
                    : 'text-gray-100 hover:bg-white/10 hover:text-white'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      onClick={onLinkClick}
      className={clsx(
        'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition',
        isMobile ? 'min-h-11 w-full' : '',
        isActive
          ? 'bg-dark-green text-white shadow-sm'
          : 'text-gray-100 hover:bg-white/10 hover:text-white'
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

function AuthButton({
  isLoggedIn,
  handleLogout,
  isMobile = false,
}: {
  isLoggedIn: boolean
  handleLogout: () => void
  isMobile?: boolean
}) {
  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition min-h-11',
          'bg-red-600 text-white hover:bg-red-700',
          isMobile ? 'w-full' : ''
        )}
      >
        Logout
      </button>
    )
  }

  return (
    <Link
      href="/login"
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition min-h-11',
        'bg-dark-green text-white hover:bg-green-900',
        isMobile ? 'w-full' : ''
      )}
    >
      Login
    </Link>
  )
}