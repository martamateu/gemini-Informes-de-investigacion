'use client'

import { Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReportCard, type Report } from '@/components/report-card'
import { ResearchLoading } from '@/components/research-loading'
import { ReportMarkdown } from '@/components/report-markdown'
import { fullDateEs, shortDateEs, weekRange } from '@/lib/dates'

async function* parseSSEStream(response: Response) {
  if (!response.body) throw new Error('Sin respuesta del servidor')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data)
        } catch {
          /* ignore */
        }
      }
    }
  }
}

export function ResearchView() {
  const today = useMemo(() => new Date(), [])
  const { tuesday, friday } = useMemo(() => weekRange(today), [today])

  const queryMercados = `Hazme un informe de investigación de los mercados bursátiles del ${shortDateEs(
    tuesday,
  )} al ${shortDateEs(friday)}.`
  const queryFinancieros = `Hazme un informe de investigación de un análisis de los mercados financieros del ${shortDateEs(
    tuesday,
  )} al ${shortDateEs(friday)}.`

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)

  async function runResearch(query: string) {
    const q = query.trim()
    if (!q || loading) return

    setError(null)
    setLoading(true)
    setStreaming('')
    setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }),
      100,
    )

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error('No se pudo generar el informe')

      let full = ''
      for await (const chunk of parseSSEStream(res)) {
        if (chunk.type === 'text-delta' && chunk.delta) {
          full += chunk.delta
          setStreaming(full)
        }
      }

      if (!full.trim()) throw new Error('El informe llegó vacío')

      const report: Report = {
        id: crypto.randomUUID(),
        query: q,
        content: full,
        date: new Date(),
      }
      setReports((prev) => [report, ...prev])
      setStreaming('')
      setInput('')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Ha ocurrido un error. Inténtalo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-20 pt-8 sm:px-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-lg font-semibold uppercase tracking-wide text-primary">
          Investigación
        </span>
      </div>

      {/* Date header */}
      <header className="mb-8">
        <p className="text-pretty text-3xl font-bold leading-tight text-foreground sm:text-5xl">
          {fullDateEs(today)}
        </p>
      </header>

      {/* Greeting */}
      <h1 className="mb-6 text-pretty text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
        Hola Miquel, ¿qué quieres investigar hoy?
      </h1>

      {/* Quick buttons */}
      <div className="mb-6 grid gap-4">
        <button
          type="button"
          onClick={() => setInput(queryMercados)}
          className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:bg-accent/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <TrendingUp className="h-8 w-8" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-bold text-foreground">
              Mercados bursátiles
            </span>
            <span className="block text-lg text-muted-foreground">
              {shortDateEs(tuesday)} → {shortDateEs(friday)}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setInput(queryFinancieros)}
          className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:bg-accent/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <TrendingDown className="h-8 w-8" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-bold text-foreground">
              Mercados financieros
            </span>
            <span className="block text-lg text-muted-foreground">
              {shortDateEs(tuesday)} → {shortDateEs(friday)}
            </span>
          </span>
        </button>
      </div>

      {/* Input */}
      <label htmlFor="query" className="mb-3 block text-xl font-medium">
        Escribe o edita tu pregunta:
      </label>
      <textarea
        id="query"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        placeholder="Por ejemplo: ¿Cómo van los mercados esta semana?"
        className="mb-5 w-full resize-none rounded-3xl border-2 border-input bg-card px-5 py-4 text-xl leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <Button
        onClick={() => runResearch(input)}
        disabled={loading || !input.trim()}
        className="h-20 w-full gap-3 rounded-3xl text-2xl font-bold shadow-md"
      >
        <Search className="h-7 w-7" aria-hidden />
        Generar Informe
      </Button>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-destructive/10 px-5 py-4 text-lg font-medium text-destructive"
        >
          {error}
        </p>
      )}

      {/* Results */}
      <div ref={resultsRef} className="mt-10 flex flex-col gap-8">
        {loading && !streaming && <ResearchLoading />}

        {loading && streaming && (
          <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <header className="flex items-center gap-3 border-b border-border bg-accent/30 px-5 py-4">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
              </span>
              <span className="text-lg font-bold text-foreground">
                Escribiendo el informe...
              </span>
            </header>
            <div className="px-5 py-6 sm:px-7">
              <ReportMarkdown content={streaming} />
            </div>
          </article>
        )}

        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </main>
  )
}
