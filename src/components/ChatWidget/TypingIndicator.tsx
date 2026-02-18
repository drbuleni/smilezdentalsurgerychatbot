'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 w-fit" style={{ background: '#FFFFFF', borderRadius: '1.125rem 1.125rem 1.125rem 0.25rem', boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
      <span className="text-xs mr-1" style={{ color: '#9CA3AF' }}>Typing</span>
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{ background: '#A855F7', animationDelay: '0ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{ background: '#38BDF8', animationDelay: '150ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{ background: '#F9A8D4', animationDelay: '300ms', animationDuration: '1s' }}
      />
    </div>
  )
}
