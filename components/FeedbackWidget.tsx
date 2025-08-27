'use client'

import { useState } from 'react'

// --- SVG Icons ---
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a4 4 0 0 1 -4 -4v-1a.5 .5 0 0 0 -1 0v1" />
    </svg>
)

const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
    </svg>
)

// ✨ ADDED: Gmail/Email Icon
const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <polyline points="3 7 12 13 21 7" />
    </svg>
)

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
// --- End SVG Icons ---

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(false)
  const [step, setStep] = useState<'input' | 'apps'>('input')

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedback.trim().length < 10) {
      setError(true)
      return
    }
    setError(false)
    setStep('apps')
  }

  const handleSend = (platform: 'whatsapp' | 'telegram' | 'gmail') => {
    const myPhoneNumber = '919645184118'
    const myTelegramUsername = 'shuhaib_tvm'
    const myEmail = 'hafizshuhaibwafy@gmail.com'

    const encodedFeedback = encodeURIComponent(feedback)
    let url = ''

    if (platform === 'whatsapp') {
      url = `https://wa.me/${myPhoneNumber}?text=${encodedFeedback}`
    } else if (platform === 'telegram') {
      url = `https://t.me/${myTelegramUsername}?text=${encodedFeedback}`
    } else if (platform === 'gmail') {
      const subject = encodeURIComponent('Library Feedback')
      url = `mailto:${myEmail}?subject=${subject}&body=${encodedFeedback}`
    }

    window.open(url, '_blank')
    resetWidget()
  }

  const resetWidget = () => {
    setIsOpen(false)
    setFeedback('')
    setError(false)
    setTimeout(() => setStep('input'), 300)
  }

  return (
    <>
      {/* Feedback Panel */}
      <div className={`fixed bottom-24 right-4 z-50 w-80 bg-secondary-white rounded-xl shadow-2xl border border-primary-dark-grey transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="p-6">
          {step === 'input' ? (
            <>
              <h3 className="font-bold text-lg text-heading-text-black">Share Feedback</h3>
              <p className="text-sm text-text-grey mb-4">Have a suggestion or found a bug? Let us know!</p>
              <form onSubmit={handleProceed}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 p-2 border border-primary-dark-grey rounded-md bg-primary-grey text-text-grey focus:outline-none focus:ring-2 focus:ring-button-yellow"
                  required
                  minLength={10}
                />
                {error && <p className="text-xs text-red-500 mt-1">Please enter at least 10 characters.</p>}
                <button
                  type="submit"
                  className="w-full mt-4 bg-button-yellow text-button-text-black font-bold py-2 px-4 rounded-lg transition hover:bg-primary-dark-grey"
                >
                  Proceed
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg text-heading-text-black">Choose an App</h3>
              <p className="text-sm text-text-grey mb-4">How would you like to send your message?</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleSend('whatsapp')}
                  className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon />
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => handleSend('telegram')}
                  className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition flex items-center justify-center gap-2"
                >
                  <TelegramIcon />
                  Send via Telegram
                </button>
                {/* ✨ ADDED: Gmail button */}
                <button
                  onClick={() => handleSend('gmail')}
                  className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <GmailIcon />
                  Send via Email
                </button>
                <button
                  onClick={() => setStep('input')}
                  className="w-full text-sm text-text-grey mt-2 hover:underline"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-button-yellow text-button-text-black w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:bg-secondary-white hover:scale-110"
        aria-label="Toggle feedback widget"
      >
        {isOpen ? <CloseIcon /> : <MessageIcon />}
      </button>
    </>
  )
}
