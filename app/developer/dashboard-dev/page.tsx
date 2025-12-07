'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'
import dayjs from 'dayjs'
import {
  Bug,
  Lightbulb,
  CheckCircle,
  LogOut,
  MessageSquare,
  User,
  Reply,
  Send,
  Edit2,
  X,
  Image as ImageIcon,
  Clock
} from 'lucide-react'
import clsx from 'classnames'

type Feedback = {
  id: string
  message: string
  type: 'bug' | 'recommendation' | 'other'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'resolved'
  submitted_by: string
  created_at: string
  reply?: string | null
  reply_at?: string | null
  screenshot_url?: string | null
}

export default function DeveloperDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending')

  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session || session.user.user_metadata?.role !== 'developer') {
            router.replace('/login')
            return
        }
        fetchFeedback()
    }
    checkAuth()
  }, [router])

  const fetchFeedback = async () => {
    setLoading(true)
    const { data, error } = await supabase
        .from('developer_feedback')
        .select('*')
        .order('created_at', { ascending: false })

    if (data) setFeedbacks(data as Feedback[])
    setLoading(false)
  }

  const handleResolve = async (id: string) => {
      const { error } = await supabase
        .from('developer_feedback')
        .update({ status: 'resolved' })
        .eq('id', id)

      if (!error) {
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' } : f))
      }
  }

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);

    const timestamp = new Date().toISOString();

    const { error } = await supabase
        .from('developer_feedback')
        .update({
            reply: replyText,
            reply_at: timestamp
        })
        .eq('id', id);

    if (error) {
        alert('Failed to send reply.');
        console.error(error);
    } else {
        // Update local state
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, reply: replyText, reply_at: timestamp } : f));
        setReplyingTo(null);
        setReplyText('');
    }
    setSendingReply(false);
  }

  const startEditingReply = (item: Feedback) => {
      setReplyingTo(item.id);
      setReplyText(item.reply || '');
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Derived state
  const filteredFeedbacks = feedbacks.filter(f => f.status === filter)
  const pendingBugs = feedbacks.filter(f => f.type === 'bug' && f.status === 'pending').length
  const pendingRecs = feedbacks.filter(f => f.type === 'recommendation' && f.status === 'pending').length

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-primary-grey text-heading-text-black pt-24 px-4 pb-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-primary-dark-grey pb-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-heading text-heading-text-black uppercase tracking-wider flex items-center gap-3">
                    <span className="bg-blue-600 text-white p-2 rounded-lg shadow-md"><Bug size={24} /></span>
                    Developer Console
                </h1>
                <p className="text-text-grey mt-1">Manage system feedback, track bugs, and respond to librarians.</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition flex items-center gap-2 font-bold border border-red-200">
                <LogOut size={18} /> Logout
            </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary-white border border-primary-dark-grey p-6 rounded-xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-red-100 text-red-600 rounded-full"><Bug size={24} /></div>
                <div>
                    <p className="text-sm font-semibold text-text-grey">Pending Bugs</p>
                    <p className="text-3xl font-bold text-heading-text-black">{pendingBugs}</p>
                </div>
            </div>
            <div className="bg-secondary-white border border-primary-dark-grey p-6 rounded-xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Lightbulb size={24} /></div>
                <div>
                    <p className="text-sm font-semibold text-text-grey">Recommendations</p>
                    <p className="text-3xl font-bold text-heading-text-black">{pendingRecs}</p>
                </div>
            </div>
            <div className="bg-secondary-white border border-primary-dark-grey p-6 rounded-xl flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle size={24} /></div>
                <div>
                    <p className="text-sm font-semibold text-text-grey">Total Resolved</p>
                    <p className="text-3xl font-bold text-heading-text-black">{feedbacks.filter(f => f.status === 'resolved').length}</p>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-primary-dark-grey">
                <button
                    onClick={() => setFilter('pending')}
                    className={clsx("pb-3 px-1 font-bold text-lg transition relative",
                        filter === 'pending'
                        ? "text-blue-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-blue-600 after:rounded-t-full"
                        : "text-text-grey hover:text-heading-text-black"
                    )}
                >
                    Pending Tasks <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">{feedbacks.filter(f => f.status === 'pending').length}</span>
                </button>
                <button
                    onClick={() => setFilter('resolved')}
                    className={clsx("pb-3 px-1 font-bold text-lg transition relative",
                        filter === 'resolved'
                        ? "text-green-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-green-600 after:rounded-t-full"
                        : "text-text-grey hover:text-heading-text-black"
                    )}
                >
                    Resolved History
                </button>
            </div>

            {/* Feedback List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-16 bg-secondary-white rounded-xl border border-primary-dark-grey shadow-inner">
                        <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-text-grey font-medium">No items found in {filter} list.</p>
                    </div>
                ) : (
                    filteredFeedbacks.map(item => (
                        <div key={item.id} className="bg-secondary-white border border-primary-dark-grey rounded-xl p-6 flex flex-col gap-4 shadow-md hover:shadow-lg transition duration-200">

                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                {/* Icon Column */}
                                <div className="flex-shrink-0 pt-1">
                                    {item.type === 'bug' ? (
                                        <div className="p-3 bg-red-100 text-red-600 rounded-xl border border-red-200"><Bug size={24} /></div>
                                    ) : item.type === 'recommendation' ? (
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl border border-blue-200"><Lightbulb size={24} /></div>
                                    ) : (
                                        <div className="p-3 bg-gray-100 text-gray-600 rounded-xl border border-gray-200"><MessageSquare size={24} /></div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className="flex-grow space-y-3">
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-heading-text-black uppercase tracking-wide">{item.type}</h3>
                                            <span className={clsx("text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border",
                                                item.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                                item.priority === 'medium' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                'bg-green-100 text-green-800 border-green-200'
                                            )}>
                                                {item.priority} Priority
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-text-grey flex items-center gap-1 bg-primary-grey px-2 py-1 rounded-md border border-primary-dark-grey">
                                            <Clock size={12} /> {dayjs(item.created_at).format('DD MMM YYYY, h:mm A')}
                                        </span>
                                    </div>

                                    <p className="text-heading-text-black leading-relaxed whitespace-pre-wrap text-sm md:text-base bg-primary-grey p-4 rounded-lg border border-primary-dark-grey">
                                        {item.message}
                                    </p>

                                    {/* Screenshot Display */}
                                    {item.screenshot_url && (
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-text-grey mb-1 flex items-center gap-1"><ImageIcon size={12}/> Screenshot</p>
                                            <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                <img src={item.screenshot_url} alt="Screenshot" className="max-h-40 rounded-lg border border-primary-dark-grey hover:opacity-90 transition cursor-zoom-in" />
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-text-grey">
                                        <User size={14} />
                                        <span>Submitted by: <span className="text-dark-green font-semibold">{item.submitted_by || 'Anonymous'}</span></span>
                                    </div>
                                </div>

                                {/* Action Column */}
                                <div className="flex-shrink-0 flex flex-col gap-2 min-w-[140px]">
                                    {item.status === 'pending' ? (
                                        <button
                                            onClick={() => handleResolve(item.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition shadow-sm text-sm"
                                        >
                                            <CheckCircle size={16} /> Resolve
                                        </button>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold border border-green-200 text-sm">
                                            <CheckCircle size={16} /> Resolved
                                        </span>
                                    )}

                                    {replyingTo !== item.id && (
                                        <button
                                            onClick={() => {
                                                if(item.reply) startEditingReply(item);
                                                else { setReplyingTo(item.id); setReplyText(''); }
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition shadow-sm text-sm"
                                        >
                                            {item.reply ? <><Edit2 size={16} /> Edit Reply</> : <><Reply size={16} /> Reply</>}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reply Section */}
                            {item.reply && replyingTo !== item.id && (
                                <div className="mt-2 pl-4 md:pl-16 border-l-4 border-dark-green">
                                    <div className="bg-green-50 border border-green-100 rounded-r-lg rounded-bl-lg p-4 relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white bg-dark-green px-2 py-0.5 rounded">DEV REPLY</span>
                                                <span className="text-xs text-text-grey">{dayjs(item.reply_at).format('DD MMM, h:mm A')}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-heading-text-black font-medium">{item.reply}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reply Form */}
                            {replyingTo === item.id && (
                                <div className="mt-4 pl-4 md:pl-16 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-white border-2 border-blue-100 rounded-xl p-4 shadow-inner">
                                        <h4 className="text-sm font-bold text-heading-text-black mb-2 flex items-center gap-2">
                                            <Reply size={16} className="text-blue-500"/> {item.reply ? 'Edit Response' : 'Write a response'}
                                        </h4>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your reply here..."
                                            className="w-full p-3 rounded-lg bg-primary-grey border border-primary-dark-grey text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                className="px-4 py-1.5 text-sm font-semibold text-text-grey bg-primary-grey hover:bg-gray-200 rounded-lg transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSendReply(item.id)}
                                                disabled={sendingReply || !replyText.trim()}
                                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                                            >
                                                {sendingReply ? 'Saving...' : (item.reply ? 'Update' : 'Send')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  )
}