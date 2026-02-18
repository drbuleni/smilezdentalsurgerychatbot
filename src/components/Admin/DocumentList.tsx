'use client'

import { useState } from 'react'

interface Document {
  id: string
  name: string
  original_filename: string
  file_size: number
  total_chunks: number
  created_at: string
}

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string, name: string) => void
  loading?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentList({ documents, onDelete, loading }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its indexed content? This cannot be undone.`)) return
    setDeletingId(id)
    await onDelete(id, name)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
        Loading documents...
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No documents indexed yet</p>
        <p className="text-sm mt-1">Upload PDF documents above to build the knowledge base.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">Document</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Chunks</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Size</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Indexed</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-800">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.original_filename}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right text-gray-600">{doc.total_chunks}</td>
              <td className="py-3 px-4 text-right text-gray-600">{formatFileSize(doc.file_size)}</td>
              <td className="py-3 px-4 text-right text-gray-400 text-xs">
                {new Date(doc.created_at).toLocaleDateString('en-ZA')}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
                  disabled={deletingId === doc.id}
                  className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors text-xs font-medium"
                >
                  {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
