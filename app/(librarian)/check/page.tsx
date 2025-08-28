'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/app/loading'
import CheckOutForm from './CheckOutForm'
import CheckInForm from './CheckInForm'
import RenewBookForm from './RenewBookForm'
import HoldSection from './HoldSection' // A new component to manage the Hold tabs
import { ArrowUpRight, LogIn, Repeat, Library } from 'lucide-react'
import clsx from 'classnames'

type Tab = 'checkout' | 'checkin' | 'renew' | 'hold'

export default function CheckPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('checkout')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const renderContent = () => {
    switch (activeTab) {
      case 'checkout': return <CheckOutForm />
      case 'checkin': return <CheckInForm />
      case 'renew': return <RenewBookForm />
      case 'hold': return <HoldSection />
      default: return null
    }
  }

  if (loading) return <Loading />
  if (!isLoggedIn) return null

  return (
    <main className="min-h-screen bg-primary-grey pt-24 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading-text-black uppercase tracking-wider">
            Circulation Desk
          </h1>
          <p className="text-text-grey mt-1">Manage all borrowing, returning, and renewal tasks.</p>
        </div>

        {/* --- Tab Navigation --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <TabButton
            label="Check Out"
            icon={<ArrowUpRight size={18} />}
            isActive={activeTab === 'checkout'}
            onClick={() => setActiveTab('checkout')}
          />
          <TabButton
            label="Check In"
            icon={<LogIn size={18} />}
            isActive={activeTab === 'checkin'}
            onClick={() => setActiveTab('checkin')}
          />
          <TabButton
            label="Renew Book"
            icon={<Repeat size={18} />}
            isActive={activeTab === 'renew'}
            onClick={() => setActiveTab('renew')}
          />
          <TabButton
            label="Hold Books"
            icon={<Library size={18} />}
            isActive={activeTab === 'hold'}
            onClick={() => setActiveTab('hold')}
          />
        </div>

        {/* --- Tab Content --- */}
        <div className="bg-secondary-white border border-primary-dark-grey rounded-2xl shadow-xl p-6 md:p-8 min-h-[50vh]">
          {renderContent()}
        </div>
      </div>
    </main>
  )
}

// Reusable Tab Button Component
function TabButton({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200",
        isActive
          ? 'bg-dark-green text-white shadow-lg'
          : 'bg-secondary-white text-text-grey hover:bg-primary-dark-grey hover:text-heading-text-black border border-primary-dark-grey'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}