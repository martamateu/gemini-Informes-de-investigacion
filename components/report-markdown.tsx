'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-2 text-pretty text-3xl font-bold leading-tight text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-pretty text-2xl font-bold leading-snug text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-lg leading-relaxed text-foreground">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-2 list-disc space-y-2 pl-5 text-lg leading-relaxed marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-2 list-decimal space-y-2 pl-5 text-lg leading-relaxed marker:font-semibold marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary/60 bg-accent/40 py-2 pl-4 text-lg italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-5 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full border-collapse text-base">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-accent/60">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-4 py-3 text-left font-bold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-4 py-3 align-top text-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
