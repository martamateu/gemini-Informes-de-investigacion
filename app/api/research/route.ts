import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

export const maxDuration = 120

const SYSTEM_PROMPT = `Eres un sistema de Deep Research optimizado para coste y eficiencia, redactando informes para Miquel, un señor de 85 años.
Redacta siempre en español, con frases cortas y conclusiones directas. Evita el lenguaje técnico innecesario.

# PROCESO OBLIGATORIO

## 1. PLANIFICACIÓN
Antes de responder, divide el tema en:
- Máximo 5 subtemas
- Máximo 3 preguntas clave por subtema
- Prioriza fuentes de alta calidad

## 2. CRITERIO DE PARADA
Detén la investigación inmediatamente si:
- Cada subtema tiene respuesta clara
- Hay al menos 2 fuentes confiables por subtema
- No hay contradicciones críticas sin resolver

## 3. FORMATO DEL INFORME (usa Markdown)
- Empieza con un título con "#"
- "## Resumen ejecutivo" (máx. 10 líneas)
- "##" para cada subtema numerado
- Usa **negrita** para datos y cifras importantes
- Usa tablas de Markdown para comparar datos
- "## Insights clave" con máx. 10 bullets
- "## Riesgos e incertidumbres"
- "## Conclusión" con recomendación accionable
- "## Fuentes consultadas"

# OPTIMIZACIÓN DE COSTE
- Evita contenido redundante
- No expandas el informe innecesariamente
- Maximiza calidad de insights por token consumido`

export async function POST(req: Request) {
  const { query } = await req.json()

  if (!query || typeof query !== 'string') {
    return new Response('Falta la consulta', { status: 400 })
  }

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    prompt: query,
    temperature: 0.4,
  })

  try {
    await result.consumeStream()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return new Response(msg, { status: 500 })
  }

  return result.toUIMessageStreamResponse()
}
