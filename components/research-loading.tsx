'use client'

import { Loader2 } from 'lucide-react'

export function ResearchLoading({ pensando }: { pensando?: string }) {
  return (
    <section
      aria-live="polite"
      className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center"
    >
      <div className="mb-6 flex justify-center">
        <span className="relative flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-5 w-5 rounded-full bg-primary" />
        </span>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-foreground">Investigando...</h2>
      <p className="mb-6 text-xl text-muted-foreground">
        {pensando || 'Buscando en la web...'}
      </p>
      <div className="rounded-2xl bg-accent/40 px-6 py-4">
        <p className="text-lg font-medium text-foreground">
          ⏳ Esto tarda entre <strong>5 y 20 minutos</strong>
        </p>
        <p className="mt-1 text-base text-muted-foreground">
          El informe aparecerá automáticamente cuando esté listo.
        </p>
      </div>
    </section>
  )
}
