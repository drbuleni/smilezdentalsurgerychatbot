import { getOpenAIClient, EMBEDDING_MODEL } from './openai'
import { supabaseAdmin } from './supabase'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 150
const EMBED_BATCH_SIZE = 100

export interface ProcessResult {
  documentId: string
  documentName: string
  totalChunks: number
  fileSize: number
}

/**
 * Split text into overlapping chunks using a recursive character approach.
 * Works by trying to split on natural boundaries (paragraphs, sentences, spaces)
 * before resorting to hard character splits.
 */
function splitTextIntoChunks(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', '']
  const chunks: string[] = []

  function split(str: string, separatorIndex: number): void {
    if (str.length <= chunkSize) {
      if (str.trim()) chunks.push(str.trim())
      return
    }

    const sep = separators[separatorIndex]
    if (sep === undefined) {
      // Hard split as last resort
      for (let i = 0; i < str.length; i += chunkSize - overlap) {
        const chunk = str.slice(i, i + chunkSize).trim()
        if (chunk) chunks.push(chunk)
      }
      return
    }

    const parts = str.split(sep).filter(Boolean)
    if (parts.length <= 1) {
      split(str, separatorIndex + 1)
      return
    }

    let current = ''
    for (const part of parts) {
      const candidate = current ? current + sep + part : part
      if (candidate.length <= chunkSize) {
        current = candidate
      } else {
        if (current.trim()) chunks.push(current.trim())
        // If the part itself is too long, recurse with next separator
        if (part.length > chunkSize) {
          split(part, separatorIndex + 1)
          current = ''
        } else {
          current = part
        }
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }

  split(text, 0)

  // Apply overlap: include trailing text from previous chunk at start of next
  if (overlap <= 0 || chunks.length <= 1) return chunks

  const overlappedChunks: string[] = [chunks[0]]
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1]
    const suffix = prev.slice(-overlap).trim()
    const merged = suffix ? suffix + ' ' + chunks[i] : chunks[i]
    overlappedChunks.push(merged.slice(0, chunkSize * 1.5)) // cap at 1.5x to prevent runaway
  }

  return overlappedChunks
}

/**
 * Process a PDF buffer: extract text, chunk, embed, and store in Supabase.
 * @param buffer   Raw PDF file bytes
 * @param filename Original filename (displayed in knowledge base)
 */
export async function processPDF(buffer: Buffer, filename: string): Promise<ProcessResult> {
  const supabase = supabaseAdmin()
  const openai = getOpenAIClient()

  // 1. Extract text from PDF
  // Dynamic import ensures the CJS module loads correctly in Next.js App Router
  const pdfParseModule = await import('pdf-parse')
  const parsePdf = (pdfParseModule.default ?? pdfParseModule) as (
    b: Buffer
  ) => Promise<{ text: string; numpages: number }>
  const pdfData = await parsePdf(buffer)
  const rawText = pdfData.text.replace(/\s+/g, ' ').trim()

  if (!rawText || rawText.length < 50) {
    throw new Error(`PDF "${filename}" appears to be empty or contains only images/scanned content.`)
  }

  // 2. Split text into overlapping chunks
  const chunkTexts = splitTextIntoChunks(rawText)

  if (chunkTexts.length === 0) {
    throw new Error(`No text chunks could be extracted from "${filename}"`)
  }

  // 3. Create the document record in Supabase
  const { data: docRecord, error: docError } = await supabase
    .from('documents')
    .insert({
      name: filename.replace(/\.pdf$/i, ''),
      original_filename: filename,
      file_size: buffer.length,
      total_chunks: chunkTexts.length,
      metadata: { pages: pdfData.numpages },
    })
    .select()
    .single()

  if (docError || !docRecord) {
    throw new Error(`Failed to create document record: ${docError?.message}`)
  }

  // 4. Embed and store chunks in batches
  let insertedCount = 0

  for (let i = 0; i < chunkTexts.length; i += EMBED_BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + EMBED_BATCH_SIZE)

    // Generate embeddings for this batch
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    })

    const rows = batch.map((text, j) => ({
      document_id: docRecord.id,
      content: text,
      chunk_index: i + j,
      embedding: embeddingResponse.data[j].embedding,
      metadata: { source: filename, chunk_index: i + j },
    }))

    const { error: chunkError } = await supabase.from('document_chunks').insert(rows)
    if (chunkError) {
      // Rollback the document record if chunk insertion fails
      await supabase.from('documents').delete().eq('id', docRecord.id)
      throw new Error(`Failed to insert chunks: ${chunkError.message}`)
    }

    insertedCount += batch.length
  }

  // 5. Update total_chunks count
  await supabase
    .from('documents')
    .update({ total_chunks: insertedCount })
    .eq('id', docRecord.id)

  return {
    documentId: docRecord.id,
    documentName: docRecord.name,
    totalChunks: insertedCount,
    fileSize: buffer.length,
  }
}
