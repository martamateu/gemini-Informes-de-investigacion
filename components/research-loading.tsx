'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const PASOS = [
  'Entendiendo tu pregunta...',
  'Buscando en la web...',
  'Leyendo fuentes fiables...',
  'Comparando los datos...',
  'Redactando el informe...',
]

export function ResearchLoading() {
  const [activo, setActivo] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActivo((p) => (p < PASOS.length - 1 ? p + 1 : p))
    }, 2600)
    return () => clearInterval(id)
  }, [])

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

      <ul className="space-y-4">
        {PASOS.map((paso, i) => {
          const completado = i < activo
          const enCurso = i === activo
          return (
            <li
              key={paso}
              className={`flex items-center gap-3 text-lg transition-opacity ${
                i <= activo ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                {completado ? (
                  <Check className="h-6 w-6 text-primary" aria-hidden />
                ) : enCurso ? (
                  <Loader2
                    className="h-6 w-6 animate-spin text-primary"
                    aria-hidden
                  />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span
                className={
                  completado
                    ? 'text-muted-foreground'
                    : 'font-medium text-foreground'
                }
              >
                {paso}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-base text-muted-foreground">
        Esto puede tardar un minuto. Por favor, espera.
      </p>
    </section>
  )
}
