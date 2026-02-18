'use client'

import { useState, useEffect, useCallback } from 'react'
import DocumentList from '@/components/Admin/DocumentList'
import UploadForm from '@/components/Admin/UploadForm'

interface Document {
  id: string
  name: string
  original_filename: string
  file_size: number
  total_chunks: number
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [notification, setNotification] = useState('')

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const res = await fetch('/api/admin/documents', {
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Failed to fetch documents', err)
    } finally {
      setLoadingDocs(false)
    }
  }, [password])

  useEffect(() => {
    if (authenticated) fetchDocuments()
  }, [authenticated, fetchDocuments])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')

    const res = await fetch('/api/admin/documents', {
      headers: { 'x-admin-password': password },
    })

    if (res.ok) {
      setAuthenticated(true)
    } else {
      setAuthError('Incorrect password. Please try again.')
    }
  }

  async function handleDelete(id: string, name: string) {
    const res = await fetch(`/api/admin/documents?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    })

    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      showNotification(`"${name}" deleted successfully`)
    } else {
      showNotification('Failed to delete document')
    }
  }

  function showNotification(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(''), 4000)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-sm text-gray-500 mt-1">Smilez Dental Knowledge Base</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              {authError && <p className="text-xs text-red-500 mt-1">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-teal-600 text-white px-6 py-4 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Smilez Dental — Admin Dashboard</h1>
            <p className="text-teal-100 text-xs mt-0.5">Knowledge Base Management</p>
          </div>
          <button
            onClick={() => { setAuthenticated(false); setPassword('') }}
            className="text-teal-100 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Documents Indexed</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{documents.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Chunks</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">
              {documents.reduce((sum, d) => sum + d.total_chunks, 0)}
            </p>
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Upload New Document</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload PDF files to add them to the chatbot's knowledge base
            </p>
          </div>
          <div className="p-6">
            <UploadForm
              password={password}
              onUploadComplete={() => {
                fetchDocuments()
                showNotification('Document processed and indexed successfully!')
              }}
            />
          </div>
        </div>

        {/* Documents list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Knowledge Base Documents</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All indexed documents available to the chatbot
              </p>
            </div>
            <button
              onClick={fetchDocuments}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            loading={loadingDocs}
          />
        </div>

        {/* Chat preview link */}
        <div className="bg-teal-50 rounded-xl p-5 border border-teal-100 text-center">
          <p className="text-sm text-teal-800 font-medium">Test the chatbot</p>
          <p className="text-xs text-teal-600 mt-1 mb-3">
            Preview the widget to verify your knowledge base is working
          </p>
          <a
            href="/widget"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
          >
            Open Widget Preview
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  )
}
