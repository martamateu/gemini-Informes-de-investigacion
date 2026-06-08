import { GoogleGenAI } from '@google/genai'

export const maxDuration = 300

const INSTRUCCIONES = `Redacta un informe de investigación exhaustivo y detallado en español sobre el siguiente tema. 

El informe debe ser completo, con análisis profundo, datos concretos, cifras actualizadas y citas de fuentes fiables. Investiga a fondo: consulta múltiples fuentes, analiza tendencias, compara datos y extrae conclusiones fundamentadas.

Estructura el informe con el siguiente formato Markdown:

# [Título del informe]

## Resumen ejecutivo
(Síntesis de los hallazgos más importantes, 10-15 líneas)

## [Sección 1: primer gran tema]
(Análisis detallado con datos, cifras y contexto)

## [Sección 2: segundo gran tema]
...

(Añade tantas secciones como sean necesarias para cubrir el tema en profundidad)

## Datos y estadísticas clave
(Tabla o tablas comparativas con los datos más relevantes)

## Análisis de riesgos e incertidumbres
(Factores de riesgo, variables desconocidas, escenarios posibles)

## Conclusión y recomendaciones
(Conclusiones claras y recomendaciones accionables)

## Fuentes consultadas
(Lista de fuentes con URL cuando sea posible)

---

Tema a investigar:
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
