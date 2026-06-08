import { GoogleGenAI } from '@google/genai'

export const maxDuration = 300

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
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const interaction = client.interactions.create({
          input: INSTRUCCIONES + query,
          agent: 'deep-research-preview-04-2026',
          background: true,
          stream: true,
          agent_config: { type: 'deep-research', thinking_summaries: 'auto' },
        })

        for await (const event of await interaction) {
          if (event.eventType === 'step.delta') {
            if (event.delta?.type === 'text') {
              send({ type: 'text-delta', delta: event.delta.text })
            } else if (event.delta?.type === 'thought') {
              send({ type: 'thought', text: event.delta.text })
            }
          }
        }
      } catch (e: unknown) {
        send({ type: 'error', message: e instanceof Error ? e.message : 'Error desconocido' })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
