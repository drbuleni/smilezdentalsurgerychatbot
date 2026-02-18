import ChatWidget from '@/components/ChatWidget'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smilez Dental Assistant',
  description: 'Chat with our AI dental assistant',
  robots: 'noindex',
}

/**
 * Standalone widget page — used as the iframe target for Wix embedding.
 * No header, footer or navigation. Just the chat widget, always open.
 */
export default function WidgetPage() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="h-screen bg-transparent flex flex-col">
      <ChatWidget embedded={true} apiUrl={apiUrl} />
    </div>
  )
}
