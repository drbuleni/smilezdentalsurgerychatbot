/**
 * CLI script for bulk PDF ingestion into the Smilez Dental knowledge base.
 *
 * Usage:
 *   npx ts-node scripts/process-pdfs.ts ./pdfs/
 *   npx ts-node scripts/process-pdfs.ts ./pdfs/services.pdf
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, OPENAI_API_KEY
 *     must be set in .env.local or as environment variables
 *
 * Install dotenv for local use:
 *   npm install -D dotenv
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
} catch {
  // dotenv not installed — env vars must be set manually
}

import { processPDF } from '../src/lib/pdf-processor'

const SUPPORTED_EXT = '.pdf'

async function run() {
  const target = process.argv[2]

  if (!target) {
    console.error('Usage: npx ts-node scripts/process-pdfs.ts <path-to-pdf-or-folder>')
    process.exit(1)
  }

  // Validate required env vars
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`)
    console.error('Create a .env.local file with these values.')
    process.exit(1)
  }

  const absTarget = path.resolve(target)

  let files: string[] = []

  if (fs.statSync(absTarget).isDirectory()) {
    const entries = fs.readdirSync(absTarget)
    files = entries
      .filter((f) => path.extname(f).toLowerCase() === SUPPORTED_EXT)
      .map((f) => path.join(absTarget, f))

    if (files.length === 0) {
      console.error(`No PDF files found in directory: ${absTarget}`)
      process.exit(1)
    }
  } else if (path.extname(absTarget).toLowerCase() === SUPPORTED_EXT) {
    files = [absTarget]
  } else {
    console.error(`Target must be a .pdf file or a directory containing .pdf files`)
    process.exit(1)
  }

  console.log(`\n📄 Smilez Dental — PDF Ingestion Pipeline`)
  console.log(`Processing ${files.length} file(s)...\n`)

  let successCount = 0
  let failCount = 0

  for (const filePath of files) {
    const filename = path.basename(filePath)
    process.stdout.write(`  → ${filename} ... `)

    try {
      const buffer = fs.readFileSync(filePath)
      const result = await processPDF(buffer, filename)
      console.log(`✓ ${result.totalChunks} chunks indexed (ID: ${result.documentId})`)
      successCount++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.log(`✗ FAILED: ${message}`)
      failCount++
    }
  }

  console.log(`\n✅ Done: ${successCount} succeeded, ${failCount} failed\n`)

  if (failCount > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
