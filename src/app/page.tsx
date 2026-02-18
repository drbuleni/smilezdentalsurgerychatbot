export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FBFC] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Smilez Dental Chatbot</h1>
        <p className="text-gray-500 mb-8">AI-powered patient support system</p>

        <div className="space-y-3">
          <a
            href="/widget"
            className="flex items-center justify-between px-5 py-3.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            <span className="font-medium">Preview Chat Widget</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/admin"
            className="flex items-center justify-between px-5 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">Admin Dashboard</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          For Wix embedding instructions, see README.md
        </p>
      </div>
    </div>
  )
}
