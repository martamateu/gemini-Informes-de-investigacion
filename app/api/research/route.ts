import { GoogleGenAI } from '@google/genai'

export const maxDuration = 300

const INSTRUCCIONES = `Eres un asistente de investigación para Miquel, un señor de 85 años.
Redacta siempre en español, con frases cortas y conclusiones directas.
Evita el lenguaje técnico innecesario.

# REGLAS DE EFICIENCIA (MUY IMPORTANTE)
- Máximo 3 subtemas
- Máximo 20 búsquedas en total
- Si 2 fuentes confirman lo mismo, NO busques más
- Detente cuando cada subtema tenga respuesta clara
- NO amplies el scope más allá de lo pedido

# FORMATO DEL INFORME (usa Markdown)
- Título con "#"
- "## Resumen" (máx. 5 líneas)
- Secciones "##" por subtema (máx. 3)
- **negrita** para datos importantes
- Tablas para comparar datos
- "## Conclusión" con recomendación clara
- "## Fuentes" con lista breve

Consulta a investigar:
`

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
}

// POST /api/research → inicia la investigación, devuelve { id }
export async function POST(req: Request) {
  const { query } = await req.json()
  if (!query || typeof query !== 'string') {
    return Response.json({ error: 'Falta la consulta' }, { status: 400 })
  }

  try {
    const client = getClient()
    const interaction = await client.interactions.create({
      input: INSTRUCCIONES + query,
      agent: 'deep-research-preview-04-2026',
      background: true,
      store: true,
      agent_config: { type: 'deep-research' },
    })
    const id = (interaction as { id: string }).id
    return Response.json({ id })
  } catch (e: unknown) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Error al iniciar' },
      { status: 500 },
    )
  }
}

// GET /api/research?id=xxx → devuelve estado + texto si completado
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Falta el id' }, { status: 400 })

  try {
    const client = getClient()
    const result = await client.interactions.get(id)
    const status = (result as Record<string, unknown>).status as string
    const text = (result as Record<string, unknown>).output_text as string | undefined
    const error = (result as Record<string, unknown>).error as string | undefined
    return Response.json({ status, text: text ?? null, error: error ?? null })
  } catch (e: unknown) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Error al consultar' },
      { status: 500 },
    )
  }
}
