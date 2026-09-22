import { Fragment } from 'react'
import { splitHighlight } from '@/lib/search'

interface HighlightProps {
  text: string
  query: string
}

/** 検索語に一致した部分を強調する */
export function Highlight({ text, query }: HighlightProps) {
  if (!query.trim()) return <>{text}</>
  return (
    <>
      {splitHighlight(text, query).map((part, index) => (
        <Fragment key={index}>
          {part.hit ? (
            <mark className="rounded-sm bg-warning-soft px-0.5 text-foreground">{part.text}</mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </>
  )
}
