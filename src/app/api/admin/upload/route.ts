import { NextRequest, NextResponse } from 'next/server'
import { processPDF } from '@/lib/pdf-processor'

export const runtime = 'nodejs'
export const maxDuration = 60 // PDF processing can take time

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function checkAdminAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const provided =
    request.headers.get('x-admin-password') ||
    request.nextUrl.searchParams.get('password')

  return provided === adminPassword
}

// POST /api/admin/upload — upload and process a PDF
export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Only PDF files are supported' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is 10 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
      { status: 400 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await processPDF(buffer, file.name)

    return NextResponse.json({
      success: true,
      document: {
        id: result.documentId,
        name: result.documentName,
        totalChunks: result.totalChunks,
        fileSize: result.fileSize,
      },
      message: `Successfully processed "${result.documentName}" — ${result.totalChunks} chunks indexed.`,
    })
  } catch (error) {
    console.error('Upload processing error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: `Failed to process PDF: ${message}` }, { status: 500 })
  }
}
