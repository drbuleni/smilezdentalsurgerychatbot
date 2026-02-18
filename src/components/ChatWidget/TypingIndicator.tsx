'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 w-fit rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm">
      <span className="text-xs text-gray-400 mr-1">Smilez is typing</span>
      <span
        className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '1s' }}
      />
    </div>
  )
}
