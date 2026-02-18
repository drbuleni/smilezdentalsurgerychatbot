'use client'

import { useState, useRef, useCallback } from 'react'

interface UploadFormProps {
  password: string
  onUploadComplete: () => void
}

interface UploadResult {
  success: boolean
  message: string
  document?: { name: string; totalChunks: number }
}

export default function UploadForm({ password, onUploadComplete }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setResult({ success: false, message: 'Only PDF files are supported.' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setResult({ success: false, message: 'File too large. Maximum size is 10 MB.' })
        return
      }

      setUploading(true)
      setResult(null)
      setProgress(10)

      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress since we can't track actual server progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85))
      }, 800)

      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'x-admin-password': password },
          body: formData,
        })

        clearInterval(progressInterval)
        setProgress(100)

        const data = await response.json()

        if (response.ok && data.success) {
          setResult({
            success: true,
            message: data.message,
            document: data.document,
          })
          onUploadComplete()
        } else {
          setResult({ success: false, message: data.error || 'Upload failed.' })
        }
      } catch (err) {
        clearInterval(progressInterval)
        setResult({ success: false, message: 'Network error. Please try again.' })
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 1000)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [password, onUploadComplete]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-teal-400 bg-teal-50'
            : uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600 font-medium">Processing PDF...</p>
            <p className="text-xs text-gray-400">Extracting text, creating embeddings and indexing — this may take a minute</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mx-auto max-w-xs">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drop a PDF here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF files only · Maximum 10 MB</p>
          </>
        )}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <p className="font-medium">{result.success ? '✓ Success' : '✗ Error'}</p>
          <p className="mt-0.5">{result.message}</p>
          {result.success && result.document && (
            <p className="text-xs mt-1 opacity-75">
              {result.document.totalChunks} text chunks indexed
            </p>
          )}
        </div>
      )}
    </div>
  )
}
