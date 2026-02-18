import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

function checkAdminAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const provided =
    request.headers.get('x-admin-password') ||
    request.nextUrl.searchParams.get('password')

  return provided === adminPassword
}

// GET /api/admin/documents — list all documents
export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, original_filename, file_size, total_chunks, metadata, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: data })
}

// DELETE /api/admin/documents?id=<uuid> — delete a document and its chunks
export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
  }

  const supabase = supabaseAdmin()

  // ON DELETE CASCADE removes chunks automatically
  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Document deleted successfully' })
}
