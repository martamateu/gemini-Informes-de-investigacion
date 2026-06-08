'use client'

import { Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportMarkdown } from '@/components/report-markdown'
import { fullDateEs } from '@/lib/dates'

function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inl = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

  let html = ''
  const lines = md.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) { html += `<h1>${inl(line.slice(2))}</h1>`; i++; continue }
    if (line.startsWith('## ')) { html += `<h2>${inl(line.slice(3))}</h2>`; i++; continue }
    if (line.startsWith('### ')) { html += `<h3>${inl(line.slice(4))}</h3>`; i++; continue }
    if (line.startsWith('|')) {
      const headers = line.split('|').filter((_, j, a) => j > 0 && j < a.length - 1)
      html += `<table><thead><tr>${headers.map(h => `<th>${inl(h.trim())}</th>`).join('')}</tr></thead><tbody>`
      i++
      if (lines[i]?.match(/^\|[-: |]+\|$/)) i++
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').filter((_, j, a) => j > 0 && j < a.length - 1)
        html += `<tr>${cells.map(c => `<td>${inl(c.trim())}</td>`).join('')}</tr>`
        i++
      }
      html += '</tbody></table>'
      continue
    }
    if (/^[-*] /.test(line)) {
      html += '<ul>'
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        html += `<li>${inl(lines[i].slice(2))}</li>`
        i++
      }
      html += '</ul>'
      continue
    }
    if (line.trim() === '') { html += '<br>'; i++; continue }
    html += `<p>${inl(line)}</p>`
    i++
  }
  return html
}

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
    const win = window.open('', '_blank', 'width=820,height=950')
    if (!win) return
    const body = mdToHtml(report.content)
    win.document.write(`<!doctype html><html lang="es"><head>
<meta charset="utf-8" />
<title>Informe — ${fullDateEs(report.date)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 14pt; line-height: 1.75; color: #1a1a1a; max-width: 720px; margin: 40px auto; padding: 0 28px; }
  h1 { font-size: 24pt; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 6px; }
  h2 { font-size: 18pt; margin-top: 32px; color: #222; }
  h3 { font-size: 15pt; margin-top: 20px; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 12pt; }
  th, td { border: 1px solid #aaa; padding: 8px 12px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  ul { padding-left: 24px; } li { margin-bottom: 6px; }
  p { margin: 6px 0; }
  .meta { color: #555; font-size: 11pt; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<p class="meta">Informe generado el ${fullDateEs(report.date)}</p>
${body}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); }<\/script>
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
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={handleShare}
            size="lg"
            variant="secondary"
            className="h-14 gap-2 rounded-full px-6 text-lg font-semibold"
          >
            <Share2 className="h-6 w-6" aria-hidden />
            Compartir
          </Button>
          <Button
            onClick={handlePrint}
            size="lg"
            variant="secondary"
            className="h-14 gap-2 rounded-full px-6 text-lg font-semibold"
          >
            <Printer className="h-6 w-6" aria-hidden />
            Imprimir PDF
          </Button>
        </div>
      </header>
      <div className="px-5 py-6 sm:px-7">
        <ReportMarkdown content={report.content} />
      </div>
    </article>
  )
}
