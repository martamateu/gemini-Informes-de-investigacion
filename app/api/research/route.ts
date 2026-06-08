import { GoogleGenAI } from '@google/genai'

const INSTRUCCIONES = `Eres un asistente de investigación para Miquel, un señor de 85 años.
Redacta siempre en español, con frases cortas y conclusiones directas.
Evita el lenguaje técnico innecesario.

Formato del informe (usa Markdown):
- Empieza con un título con "#".
- "## Resumen ejecutivo" (máx. 10 líneas)
- Secciones numeradas con "##" por subtema
- Usa **negrita** para datos y cifras importantes
- Usa tablas de Markdown para comparar datos
- "## Insights clave" con máx. 10 bullets
- "## Riesgos e incertidumbres"
- "## Conclusión" con recomendación accionable
- "## Fuentes consultadas"

Consulta a investigar:\n`

export async function POST(req: Request) {
  const { query } = await req.json()

  if (!query || typeof query !== 'string') {
    return new Response('Falta la consulta', { status: 400 })
  }

  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      function send(data: object) {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch { closed = true }
      }

      function ping() {
        if (closed) return
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { closed = true }
      }

      function done() {
        if (closed) return
        closed = true
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch { /* ya cerrado */ }
      }

      try {
        // 1. Lanzar investigación en background
        const interaction = await client.interactions.create({
          input: INSTRUCCIONES + query,
          agent: 'deep-research-preview-04-2026',
          background: true,
          store: true,
          agent_config: { type: 'deep-research', thinking_summaries: 'auto' },
        })

        const id = (interaction as { id: string }).id
        send({ type: 'thought', text: 'Investigación iniciada. Buscando en la web...' })

        // 2. Polling cada 10s hasta completar
        let attempts = 0
        const maxAttempts = 120 // 20 minutos máximo

        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 10000))
          if (closed) return

          ping()

          const result = await client.interactions.get(id)
          const status = (result as { status: string }).status

          if (status === 'completed') {
            const text = (result as { output_text?: string }).output_text
            if (text) {
              // Enviar el texto en chunks para simular streaming
              const chunkSize = 200
              for (let i = 0; i < text.length; i += chunkSize) {
                send({ type: 'text-delta', delta: text.slice(i, i + chunkSize) })
              }
            }
            break
          } else if (status === 'failed') {
            const err = (result as { error?: string }).error
            send({ type: 'error', message: err || 'La investigación falló' })
            break
          }

          // Actualizar pensamiento con progreso
          send({ type: 'thought', text: `Investigando... (${Math.round(attempts * 10 / 60)} min)` })
          attempts++
        }

        if (attempts >= maxAttempts) {
          send({ type: 'error', message: 'Tiempo máximo de investigación alcanzado' })
        }
      } catch (e: unknown) {
        send({ type: 'error', message: e instanceof Error ? e.message : 'Error desconocido' })
      } finally {
        done()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
