'use client'

import { Check, Loader2 } from 'lucide-react'

const PASOS = [
  'Entendiendo tu pregunta...',
  'Buscando en la web...',
  'Leyendo fuentes fiables...',
  'Comparando los datos...',
  'Redactando el informe...',
]

export function ResearchLoading({ pensando }: { pensando?: string }) {
  return (
    <section
      aria-live="polite"
      className="rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Investigando...</h2>
      </div>

      {pensando ? (
        <p className="rounded-2xl bg-accent/40 px-4 py-3 text-base italic text-muted-foreground line-clamp-3">
          {pensando}
        </p>
      ) : (
        <ul className="space-y-4">
          {PASOS.map((paso, i) => (
            <li key={paso} className="flex items-center gap-3 text-lg opacity-60">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              </span>
              <span>{paso}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
