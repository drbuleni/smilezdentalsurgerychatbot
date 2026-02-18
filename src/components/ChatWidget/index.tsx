'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ChatMessage, { Message } from './ChatMessage'
import AppointmentForm, { AppointmentData } from './AppointmentForm'
import TypingIndicator from './TypingIndicator'

interface ChatWidgetProps {
  apiUrl?: string
  initialOpen?: boolean
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

const GREETING_CONTENT = `Hello there! 😄 I'm **Dr. Thembeka Buleni's AI Assistant** — think of me as the friendly face of Smilez Dental Surgery, just without the white coat!

I can help you with:
- Services and treatments
- Pricing information
- Practice hours and location
- Booking appointment requests
- General dental health questions

**For dental emergencies, please call us directly on 013 692 8249.**

So, how can I put a smile on your face today? 😁`

export default function ChatWidget({ apiUrl = '', initialOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  // Lazy initializer so timestamp is created client-side only (prevents hydration mismatch)
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 'greeting', role: 'assistant', content: GREETING_CONTENT, timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionId = useRef(generateId())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, scrollToBottom])

  useEffect(() => {
    if (isOpen && !showAppointmentForm) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, showAppointmentForm])

  async function sendMessage(text?: string) {
    const messageText = (text || input).trim()
    if (!messageText || isStreaming) return

    setInput('')

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)

    const assistantId = generateId()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ])

    try {
      const base = apiUrl || window.location.origin
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId.current,
          history: updatedMessages
            .filter((m) => m.id !== 'greeting')
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Sorry, I encountered an error: ${err.error || 'Please try again.'}` }
              : m
          )
        )
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let sources: string[] = []

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'delta') {
              accumulatedContent += parsed.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulatedContent } : m
                )
              )
            } else if (parsed.type === 'sources') {
              sources = parsed.sources
            } else if (parsed.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulatedContent, sources } : m
                )
              )
            } else if (parsed.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: 'Sorry, an error occurred. Please try again.' }
                    : m
                )
              )
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  'Sorry, I could not connect to the server. Please try again or call us on 013 692 8249.',
              }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleAppointmentSubmit(data: AppointmentData) {
    setShowAppointmentForm(false)
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'assistant',
        content: `Thank you, **${data.fullName}**! ✅\n\nYour appointment request has been received. Our receptionist will call you on **${data.phoneNumber}** to confirm your appointment.\n\nIs there anything else I can help you with?`,
        timestamp: new Date(),
      },
    ])
  }

  const QUICK_REPLIES = [
    'What services do you offer?',
    'What are your practice hours?',
    'Book an appointment',
    'Emergency dental care',
  ]

  const canSend = input.trim().length > 0 && !isStreaming

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ background: '#A855F7', boxShadow: '0 8px 32px rgba(168,85,247,0.45)' }}
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse"
            style={{ background: '#F9A8D4' }}
          />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-[380px] flex flex-col rounded-3xl overflow-hidden z-50"
          style={{
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#FFFFFF',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ background: '#A855F7' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {/* Sparkle / AI icon */}
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-sm leading-tight truncate">
                Dr. Thembeka Buleni&apos;s AI Assistant
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                <p className="text-white/75 text-xs">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!showAppointmentForm && (
                <button
                  onClick={() => setShowAppointmentForm(true)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  title="Book appointment"
                  aria-label="Book appointment"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {showAppointmentForm ? (
            <div className="flex-1 overflow-hidden">
              <AppointmentForm
                onSubmit={handleAppointmentSubmit}
                onCancel={() => setShowAppointmentForm(false)}
                apiUrl={apiUrl}
              />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                style={{ background: '#FAFAFA' }}
              >
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isStreaming && messages[messages.length - 1]?.content === '' && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              {messages.length === 1 && (
                <div
                  className="px-4 py-2.5 flex flex-wrap gap-2"
                  style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}
                >
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() =>
                        reply === 'Book an appointment'
                          ? setShowAppointmentForm(true)
                          : sendMessage(reply)
                      }
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-opacity hover:opacity-75"
                      style={{ background: '#FEE2F0', color: '#9D174D' }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div
                className="px-4 py-3 flex-shrink-0 bg-white"
                style={{ borderTop: '1px solid #F0F0F0' }}
              >
                <div
                  className="flex items-end gap-2 px-4 py-2.5 rounded-full"
                  style={{ background: '#F3F4F6' }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    disabled={isStreaming}
                    className="flex-1 text-sm text-gray-900 bg-transparent outline-none resize-none max-h-[80px] leading-relaxed disabled:opacity-50 placeholder-gray-400"
                    style={{
                      overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden',
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!canSend}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30"
                    style={{ background: canSend ? '#A855F7' : '#D1D5DB' }}
                    aria-label="Send"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
                  AI assistant · Not a substitute for professional dental advice
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
