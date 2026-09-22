import type { ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/** 共有ノート・ナレッジ用の Markdown 表示。外部リンクは開かない（院内限定のため）。 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('text-[15px] leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-5 mb-2 text-xl font-bold first:mt-0" {...p} />,
          h2: (p) => (
            <h2
              className="mt-5 mb-2 border-b border-border pb-1 text-lg font-bold first:mt-0"
              {...p}
            />
          ),
          h3: (p) => <h3 className="mt-4 mb-1.5 text-base font-bold first:mt-0" {...p} />,
          p: (p) => <p className="my-2 break-words" {...p} />,
          ul: (p) => <ul className="my-2 list-disc space-y-1 pl-5" {...p} />,
          ol: (p) => <ol className="my-2 list-decimal space-y-1 pl-5" {...p} />,
          li: (p) => <li className="marker:text-muted-foreground" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="my-3 border-l-4 border-border bg-muted/60 py-1.5 pl-3 text-sm text-muted-foreground"
              {...p}
            />
          ),
          code: (p) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...p} />
          ),
          hr: () => <hr className="my-4 border-border" />,
          // 院内限定のため外部リンクは開かせない。span に href を渡すと不正なHTMLになるので落とす。
          a: ({ children, href }: ComponentProps<'a'>) => (
            <span className="text-primary underline underline-offset-2" title={href}>
              {children}
            </span>
          ),
          table: (p) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => (
            <th
              className="border border-border bg-muted px-2.5 py-1.5 text-left font-semibold"
              {...p}
            />
          ),
          td: (p) => <td className="border border-border px-2.5 py-1.5 align-top" {...p} />,
          input: (p) => <input className="mr-1.5 align-middle" disabled {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
