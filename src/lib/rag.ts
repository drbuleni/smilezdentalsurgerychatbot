import { getOpenAIClient, EMBEDDING_MODEL } from './openai'
import { supabaseAdmin } from './supabase'

export interface RetrievedChunk {
  id: string
  content: string
  similarity: number
  documentName: string
}

export interface RAGContext {
  chunks: RetrievedChunk[]
  sources: string[]
  contextText: string
}

/**
 * Embed a user query string using OpenAI embeddings.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const openai = getOpenAIClient()
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query.trim(),
  })
  return response.data[0].embedding
}

/**
 * Retrieve the most relevant document chunks from Supabase
 * using cosine similarity search.
 */
export async function retrieveContext(query: string, matchCount = 5): Promise<RAGContext> {
  const supabase = supabaseAdmin()
  const queryEmbedding = await embedQuery(query)

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.70,
    match_count: matchCount,
  })

  if (error) {
    console.error('RAG retrieval error:', error)
    return { chunks: [], sources: [], contextText: '' }
  }

  if (!data || data.length === 0) {
    return { chunks: [], sources: [], contextText: '' }
  }

  const chunks: RetrievedChunk[] = data.map((row: {
    id: string
    content: string
    similarity: number
    document_name: string
  }) => ({
    id: row.id,
    content: row.content,
    similarity: row.similarity,
    documentName: row.document_name,
  }))

  // Unique source names
  const sources = [...new Set(chunks.map((c) => c.documentName))]

  // Build context string for the LLM
  const contextText = chunks
    .map((c, i) => `[Source: ${c.documentName}]\n${c.content}`)
    .join('\n\n---\n\n')

  return { chunks, sources, contextText }
}

/**
 * Build the full system prompt for GPT-4o-mini, injecting retrieved context.
 */
export function buildSystemPrompt(contextText: string): string {
  const hasContext = contextText.trim().length > 0

  return `You are Smilez Dental Assistant, a friendly and professional AI assistant for Smilez Dental Surgery.

IMPORTANT GUIDELINES:
- You are an AI assistant, not a human receptionist — make this clear if asked
- Always use South African English spelling and terminology (e.g. "colour" not "color", "practise" not "practice" when used as a verb)
- Be warm, empathetic, and reassuring — dental anxiety is very common, acknowledge it when appropriate
- Keep responses concise and easy to understand — avoid overly technical language
- For DENTAL EMERGENCIES, always direct patients to call the practice immediately at 013 692 8249
- When you provide specific information sourced from the knowledge base, mention which document it comes from
- If a question is not covered by the knowledge base, politely say so and suggest the patient contact the practice directly
- Do NOT make up or guess specific prices, procedures, or policies — only state what is in the knowledge base
- Appointment booking: explain that the receptionist will call to confirm the appointment

BOOKING APPOINTMENTS:
When a patient wants to book an appointment, collect the following information step by step:
1. Full name
2. Phone number (required)
3. Email address (optional)
4. Preferred appointment date
5. Preferred time of day
6. Reason for visit
7. Any special requirements

Once you have this information, use the booking form or confirm you'll pass the details to the receptionist.

${hasContext
  ? `KNOWLEDGE BASE CONTEXT (use this to answer the patient's question accurately):
---
${contextText}
---
Use the above context to answer. Cite the source document name when providing specific information.`
  : `NOTE: No relevant information was found in the knowledge base for this query. Respond helpfully with general dental knowledge where appropriate, but for practice-specific information (prices, hours, policies), direct the patient to call 013 692 8249 or visit the practice.`
}`
}
