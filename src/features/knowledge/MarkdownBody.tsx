/**
 * ナレッジ本文（Markdown）の描画。
 *
 * `@tailwindcss/typography` は導入していないため、要素ごとに Tailwind のクラスを当てる。
 * 見出し・箇条書き・表・チェックリストが院内の端末でそのまま読めることを優先する。
 */
import Markdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/** 記事本文の見出しは h2 以下にする（画面の h1 は PageHeader が持っているため） */
const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-6 mb-2 border-b border-border pb-1.5 text-lg font-bold first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => <h3 className="mt-6 mb-2 text-base font-bold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-5 mb-2 text-sm font-bold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h5>,

  p: ({ children }) => <p className="mb-3 text-[15px] leading-relaxed last:mb-0">{children}</p>,

  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed last:mb-0">
      {children}
    </ol>
  ),
  // チェックリスト（GFM）の項目は行頭記号を消す
  li: ({ children }) => (
    <li className="pl-0.5 marker:text-muted-foreground has-[>input]:list-none">{children}</li>
  ),
  input: ({ checked, type }) =>
    type === 'checkbox' ? (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        aria-label={checked ? '実施済み' : '未実施'}
        className="mr-2 size-4 translate-y-0.5 accent-primary"
      />
    ) : null,

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),

  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-border bg-muted/60 py-2 pr-3 pl-3 text-[15px] text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-5 border-border" />,

  // 表は画面ごと横スクロールさせず、表の枠の中だけをスクロールさせる（375px 対策）
  table: ({ children }) => (
    <div className="scrollbar-slim mb-3 overflow-x-auto rounded-lg border border-border last:mb-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2 align-top leading-relaxed">{children}</td>
  ),

  code: ({ children, className }) => (
    <code className={cn('rounded bg-muted px-1 py-0.5 text-[0.9em]', className)}>{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="scrollbar-slim mb-3 overflow-x-auto rounded-lg bg-muted p-3 text-sm last:mb-0 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
}

interface MarkdownBodyProps {
  body: string
  className?: string
}

export function MarkdownBody({ body, className }: MarkdownBodyProps) {
  return (
    <div className={cn('text-foreground', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </Markdown>
    </div>
  )
}
