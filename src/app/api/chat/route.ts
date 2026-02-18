import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient, CHAT_MODEL } from '@/lib/openai'
import { retrieveContext, buildSystemPrompt } from '@/lib/rag'
import { checkRateLimit } from '@/lib/rate-limiter'

export const runtime = 'nodejs'
export const maxDuration = 30

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateCheck = checkRateLimit(ip)

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before sending another message.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateCheck.resetAt),
          'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  let body: { message: string; history?: Message[]; sessionId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, history = [] } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 })
  }

  try {
    // Retrieve relevant context from knowledge base
    const ragContext = await retrieveContext(message.trim())
    const systemPrompt = buildSystemPrompt(ragContext.contextText)

    // Build conversation messages
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      // Include last 10 messages of conversation history for context
      ...history.slice(-10),
      { role: 'user', content: message.trim() },
    ]

    const openai = getOpenAIClient()

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      max_tokens: 800,
      temperature: 0.4,
      stream: true,
    })

    // Stream the response back to the client
    const encoder = new TextEncoder()
    const sources = ragContext.sources

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`))
            }

            // Send sources when stream finishes
            if (chunk.choices[0]?.finish_reason === 'stop') {
              if (sources.length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
                )
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Remaining': String(rateCheck.remaining),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'An error occurred processing your message. Please try again.' },
      { status: 500 }
    )
  }
}
