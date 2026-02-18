'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {/* Bot avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 self-end mb-5"
          style={{ background: '#A855F7' }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
      )}

      <div className="max-w-[78%]">
        {/* Message bubble */}
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={
            isUser
              ? {
                  background: '#38BDF8',
                  color: '#FFFFFF',
                  borderRadius: '1.125rem 1.125rem 0.25rem 1.125rem',
                }
              : {
                  background: '#FFFFFF',
                  color: '#1F2937',
                  borderRadius: '1.125rem 1.125rem 1.125rem 0.25rem',
                  boxShadow: '0 1px 10px rgba(0,0,0,0.07)',
                }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-1">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-1.5 ml-1">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs flex items-center gap-1 font-medium transition-opacity hover:opacity-70"
              style={{ color: '#A855F7' }}
            >
              <svg
                className={`w-3 h-3 transition-transform ${showSources ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-1 space-y-0.5">
                {message.sources.map((source, i) => (
                  <div key={i} className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: '#C084FC' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {source}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left ml-1'}`}
          style={{ color: '#9CA3AF' }}
        >
          {message.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
