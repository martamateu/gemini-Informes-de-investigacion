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
    const r = result as Record<string, unknown>
    const status = r.status as string
    const error = r.error as string | undefined

    // 1. output_text: atajo del SDK (puede ser string vacío en vez de null)
    let text: string | null = (r.output_text && typeof r.output_text === 'string' && r.output_text.trim())
      ? r.output_text
      : null

    // 2. steps[] (breaking change mayo 2026)
    if (!text && Array.isArray(r.steps)) {
      const textParts: string[] = []
      for (const step of r.steps as Record<string, unknown>[]) {
        // model_output con content[]
        if (Array.isArray(step.content)) {
          for (const item of step.content as Record<string, unknown>[]) {
            // puede tener type='text' o simplemente tener .text directamente
            if (typeof item.text === 'string' && item.text.trim()) {
              textParts.push(item.text)
            }
          }
        }
        // texto directo en el step
        if (step.type === 'text' && typeof step.text === 'string') {
          textParts.push(step.text)
        }
      }
      if (textParts.length > 0) text = textParts.join('\n')
    }

    // 3. outputs[] (formato anterior al breaking change)
    if (!text && Array.isArray(r.outputs)) {
      const outputs = r.outputs as Record<string, unknown>[]
      const last = outputs.at(-1)
      if (last?.text) text = last.text as string
    }

    // 4. debug: si sigue null, devolver las claves del objeto para diagnosticar
    const debug = (!text && status === 'completed')
      ? {
          keys: Object.keys(r),
          stepsCount: Array.isArray(r.steps) ? (r.steps as unknown[]).length : 'no steps',
          outputsCount: Array.isArray(r.outputs) ? (r.outputs as unknown[]).length : 'no outputs',
          firstStep: Array.isArray(r.steps) ? JSON.stringify(r.steps[0]).slice(0, 200) : null,
          firstOutput: Array.isArray(r.outputs) ? JSON.stringify((r.outputs as unknown[])[0]).slice(0, 200) : null,
        }
      : undefined

    return Response.json({ status, text, error: error ?? null, debug })
  } catch (e: unknown) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Error al consultar' },
      { status: 500 },
    )
  }
}
