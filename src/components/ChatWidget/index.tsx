'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ChatMessage, { Message } from './ChatMessage'
import AppointmentForm, { AppointmentData } from './AppointmentForm'
import TypingIndicator from './TypingIndicator'

interface ChatWidgetProps {
  apiUrl?: string         // Override API base URL (for cross-origin iframe usage)
  initialOpen?: boolean   // Start with widget open
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: `Hello! I'm the **Smilez Dental Assistant** — an AI assistant here to help with any questions about our practice. 😊

I can help you with:
- Services and treatments
- Pricing information
- Practice hours and location
- Booking appointment requests
- General dental health questions

**For dental emergencies, please call us directly on 013 692 8249.**

How can I assist you today?`,
  timestamp: new Date(),
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export default function ChatWidget({ apiUrl = '', initialOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [appointmentSuccess, setAppointmentSuccess] = useState(false)
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

    // Prepare assistant placeholder
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
            // Skip malformed JSON lines
          }
        }
      }
    } catch (error) {
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
    setAppointmentSuccess(true)
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'assistant',
        content: `Thank you, **${data.fullName}**! ✅\n\nYour appointment request has been received. Our receptionist will call you on **${data.phoneNumber}** to confirm your appointment.\n\nIs there anything else I can help you with?`,
        timestamp: new Date(),
      },
    ])
    setTimeout(() => setAppointmentSuccess(false), 5000)
  }

  const QUICK_REPLIES = [
    'What services do you offer?',
    'What are your practice hours?',
    'Book an appointment',
    'Emergency dental care',
  ]

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {/* Pulsing dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-[#F8FBFC] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-100"
          style={{ maxHeight: 'calc(100vh - 48px)' }}
        >
          {/* Header */}
          <div className="bg-teal-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-sm leading-tight">Smilez Dental Assistant</h2>
              <p className="text-teal-100 text-xs">AI-powered patient support</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Appointment button */}
              {!showAppointmentForm && (
                <button
                  onClick={() => setShowAppointmentForm(true)}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Book appointment"
                  aria-label="Book appointment"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content area — messages or appointment form */}
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
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isStreaming && messages[messages.length - 1]?.content === '' && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies (only show when no messages sent yet) */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => {
                        if (reply === 'Book an appointment') {
                          setShowAppointmentForm(true)
                        } else {
                          sendMessage(reply)
                        }
                      }}
                      className="text-xs px-3 py-1.5 border border-teal-200 text-teal-700 rounded-full hover:bg-teal-50 transition-colors bg-white"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question..."
                    rows={1}
                    disabled={isStreaming}
                    className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none resize-none max-h-[100px] leading-relaxed disabled:opacity-50"
                    style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isStreaming}
                    className="flex-shrink-0 w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    aria-label="Send message"
                  >
                    <svg className="w-4 h-4 text-white disabled:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-1.5">
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
