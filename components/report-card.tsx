'use client'

import { Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportMarkdown } from '@/components/report-markdown'
import { fullDateEs } from '@/lib/dates'

export interface Report {
  id: string
  query: string
  content: string
  date: Date
}

export function ReportCard({ report }: { report: Report }) {
  async function handleShare() {
    const texto = report.content

    // Try the native share sheet first (works on Android Chrome).
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Informe de investigación',
          text: texto,
        })
        return
      } catch {
        // User cancelled or share failed: fall through to print.
      }
    }
    handlePrint()
  }

  function handlePrint() {
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    const safe = report.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    win.document.write(`<!doctype html><html lang="es"><head>
<meta charset="utf-8" />
<title>Informe de investigación</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 15pt; line-height: 1.6; color: #1a1a1a; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 24pt; } h2 { font-size: 19pt; margin-top: 28px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #999; padding: 8px 12px; text-align: left; }
  .meta { color: #666; font-size: 12pt; margin-bottom: 24px; }
  pre { white-space: pre-wrap; font-family: inherit; }
</style></head><body>
<p class="meta">${fullDateEs(report.date)}</p>
<pre>${safe}</pre>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); }<\/script>
</body></html>`)
    win.document.close()
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-accent/30 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {fullDateEs(report.date)}
          </p>
          <p className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
            {report.query}
          </p>
        </div>
        <Button
          onClick={handleShare}
          size="lg"
          variant="secondary"
          className="h-12 shrink-0 gap-2 rounded-full px-5 text-base font-semibold"
        >
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <Share2 className="h-5 w-5" aria-hidden />
          ) : (
            <Printer className="h-5 w-5" aria-hidden />
          )}
          Compartir / Imprimir
        </Button>
      </header>
      <div className="px-5 py-6 sm:px-7">
        <ReportMarkdown content={report.content} />
      </div>
    </article>
  )
}
