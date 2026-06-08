import { GoogleGenAI } from '@google/genai'

export const maxDuration = 300

const INSTRUCCIONES = `Redacta un informe de investigación exhaustivo y muy detallado en español sobre el siguiente tema. El informe debe tener un mínimo de 16 páginas y tantas como sean necesarias para cubrir el tema en profundidad.

No escatimes en detalle. Investiga a fondo consultando el mayor número posible de fuentes. Analiza tendencias históricas y actuales, compara datos, incluye cifras concretas y actualizadas, cita expertos y estudios, y extrae conclusiones fundamentadas. Cada sección debe ser extensa y bien desarrollada.

Estructura el informe con el siguiente formato Markdown:

# [Título del informe]

## Resumen ejecutivo
(Síntesis completa de los hallazgos más importantes, mínimo 15 líneas)

## Contexto y antecedentes
(Historia, evolución y contexto del tema)

## [Sección temática 1]
(Análisis detallado con datos, cifras, ejemplos y contexto)

## [Sección temática 2]
...

## [Añade todas las secciones temáticas necesarias]
...

## Datos y estadísticas clave
(Tablas comparativas con los datos más relevantes)

## Perspectivas y tendencias futuras
(Proyecciones, escenarios posibles, análisis de expertos)

## Análisis de riesgos e incertidumbres
(Factores de riesgo, variables desconocidas, escenarios adversos)

## Conclusión y recomendaciones
(Conclusiones detalladas y recomendaciones accionables)

## Fuentes consultadas
(Lista completa de fuentes con URL cuando sea posible)

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
