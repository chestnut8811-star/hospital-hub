/**
 * AI アシスタント（設計指示 §13）。
 *
 * バックエンドが無いためモック応答。AI が臨床内容を創作したように見えないよう、
 * 応答は院内ナレッジ記事への案内だけに限定し、AI の発言は人間と必ず見分けがつく形にする。
 */
import { Send, Sparkles, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildAnswer } from '@/features/knowledge/aiAnswer'
import type { AiAnswer } from '@/features/knowledge/aiAnswer'
import { formatBubbleTime } from '@/lib/format'
import { uid } from '@/lib/id'
import { useUser } from '@/stores/directoryStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { useHubStore } from '@/stores/hubStore'
import { AI_USER_ID } from '@/types'

/** 「考え中…」を挟む時間（ミリ秒）。人が読む間を作るためだけの演出 */
const THINKING_MS = 400

/** 会話はこの画面の中だけで持つ（ストアには保存しない） */
interface Turn {
  id: string
  role: 'user' | 'ai'
  at: string
  text: string
  answer?: AiAnswer
}

const SAMPLE_QUESTIONS = [
  '機器の貸出はどうすればいい？',
  '輸液ポンプのアラームが出たときの連絡先は？',
  '安否確認の回答方法は？',
  'パスワードを忘れた',
]

export function AiAssistantPage() {
  const knowledge = useHubStore((s) => s.knowledge)
  const me = useCurrentUser()
  const aiUser = useUser(AI_USER_ID)

  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  /** 「考え中…」の対象になっている質問。null なら待機中ではない */
  const [thinking, setThinking] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  /** ask() から参照するための「考え中」の最新値 */
  const thinkingRef = useRef<string | null>(null)
  const autoAskedRef = useRef(false)

  const ask = useCallback((question: string) => {
    const text = question.trim()
    if (!text) return
    // 「考え中…」の最中に次を送ると、先の質問の回答がタイマー解除で消えてしまう
    if (thinkingRef.current !== null) return
    setTurns((prev) => [
      ...prev,
      { id: uid('q'), role: 'user', at: new Date().toISOString(), text },
    ])
    setThinking(text)
    setInput('')
  }, [])

  // 「考え中…」のあとに応答を出す。画面を離れたときはタイマーを解除する
  useEffect(() => {
    if (thinking === null) return
    const timer = setTimeout(() => {
      const answer = buildAnswer(thinking, knowledge)
      setTurns((prev) => [
        ...prev,
        { id: uid('a'), role: 'ai', at: new Date().toISOString(), text: answer.text, answer },
      ])
      setThinking(null)
    }, THINKING_MS)
    return () => clearTimeout(timer)
  }, [thinking, knowledge])

  // `/ai?q=…` で来たときは最初の質問として1回だけ送る
  const [searchParams] = useSearchParams()
  const initialQuestion = searchParams.get('q') ?? ''
  useEffect(() => {
    if (autoAskedRef.current || !initialQuestion.trim()) return
    autoAskedRef.current = true
    ask(initialQuestion)
  }, [initialQuestion, ask])

  // 新しい発言が増えたら最後尾へ送る
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, thinking])

  useEffect(() => {
    thinkingRef.current = thinking
  }, [thinking])

  const canSend = useMemo(() => input.trim().length > 0 && thinking === null, [input, thinking])

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="AI アシスタント" description="院内ナレッジへの案内" backTo="/menu" />

      {/* 画面上部に固定で出す注意帯 */}
      <div className="shrink-0 border-b border-ai-border bg-ai-soft px-4 py-2">
        <p className="mx-auto flex max-w-3xl items-start gap-2 text-xs leading-relaxed text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
          <span>
            AI の回答は<strong className="font-semibold">デモ用の固定文</strong>
            です。臨床判断には使用しないでください。
          </span>
        </p>
      </div>

      <div ref={scrollRef} className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4">
          <DemoNotice />

          {turns.length === 0 && thinking === null && (
            <section className="rounded-xl bg-card p-4 ring-1 ring-border">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-ai" aria-hidden />
                よくある質問から選ぶ
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                院内ナレッジに登録されている記事を探してご案内します。手順そのものは記事と一次資料をご確認ください。
              </p>
              <div className="mt-3 grid gap-2">
                {SAMPLE_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    className="h-auto w-full justify-start py-2.5 text-left"
                    onClick={() => ask(question)}
                  >
                    <span className="min-w-0 whitespace-normal">{question}</span>
                  </Button>
                ))}
              </div>
            </section>
          )}

          {turns.map((turn) =>
            turn.role === 'user' ? (
              <div key={turn.id} className="flex items-end justify-end gap-2">
                <span className="mb-1 shrink-0 text-xs text-muted-foreground">
                  {formatBubbleTime(turn.at)}
                </span>
                <div className="max-w-[80%] rounded-msg bg-bubble-me px-3 py-2 text-[15px] leading-relaxed text-bubble-me-foreground">
                  {turn.text}
                </div>
                <UserAvatar user={me} size="sm" />
              </div>
            ) : (
              <div key={turn.id} className="flex items-start gap-2">
                <UserAvatar user={aiUser} size="sm" />
                <div className="min-w-0 max-w-[85%]">
                  <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-ai">
                    AI アシスタント
                    <span className="font-normal text-muted-foreground">
                      {formatBubbleTime(turn.at)}
                    </span>
                  </p>
                  <div className="rounded-msg border border-ai-border bg-ai-soft px-3 py-2.5">
                    <p className="text-[15px] leading-relaxed text-foreground">{turn.text}</p>

                    {turn.answer && turn.answer.docs.length > 0 && (
                      <>
                        <div className="mt-2.5 space-y-2">
                          {turn.answer.docs.map((doc) => (
                            <Link
                              key={doc.id}
                              to={`/knowledge/${doc.id}`}
                              className="block rounded-lg bg-card p-3 ring-1 ring-ai-border transition-colors hover:bg-muted/50"
                            >
                              <p className="text-sm leading-snug font-semibold text-foreground">
                                {doc.title}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {doc.summary}
                              </p>
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                出典：{doc.source}
                              </p>
                            </Link>
                          ))}
                        </div>
                        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                          手順・設定値は、記事の本文と出典の一次資料でご確認ください。
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}

          {thinking !== null && (
            <div className="flex items-start gap-2">
              <UserAvatar user={aiUser} size="sm" />
              <div>
                <p className="mb-0.5 text-xs font-semibold text-ai">AI アシスタント</p>
                <div
                  className="rounded-msg border border-ai-border bg-ai-soft px-3 py-2.5 text-[15px] text-muted-foreground"
                  aria-live="polite"
                >
                  考え中…
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力欄は下端に固定する */}
      <form
        className="shrink-0 border-t border-border bg-card px-4 py-3 pb-safe"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <label htmlFor="ai-input" className="sr-only">
            AI アシスタントへの質問
          </label>
          <Input
            id="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // Enter で送信する。日本語入力の変換確定（IME）では送信しない
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
              e.preventDefault()
              ask(input)
            }}
            placeholder="知りたいことを入力（例：貸出の手順）"
            className="flex-1"
          />
          <Button type="submit" size="icon" aria-label="送信" disabled={!canSend}>
            <Send aria-hidden />
          </Button>
        </div>
      </form>
    </div>
  )
}
