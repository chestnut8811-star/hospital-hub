import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 表示中のデータが架空であることを明示する。
 * 医療現場で使う画面なので、実データと取り違えられないよう常に出す。
 */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs leading-relaxed text-foreground',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>
        表示されている内容はすべて<strong className="font-semibold">デモ用のダミーデータ</strong>
        です。臨床判断には使用しないでください。
      </span>
    </p>
  )
}
