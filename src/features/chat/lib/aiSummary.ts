/**
 * AI要約のモック。
 *
 * バックエンドが無いので、実際のメッセージを規則で分類して並べ直すだけの処理にする。
 * **文章を創作しない**（原文をそのまま引用する）。医療現場で使う画面なので、
 * AI が内容を作ったように見える要約は出さない。
 */
import { getUser } from '@/stores/directoryStore'
import type { Message } from '@/types'
import { AI_USER_ID } from '@/types'

export interface SummarySection {
  heading: string
  items: { text: string; who: string }[]
}

export interface AiSummaryResult {
  targetCount: number
  /** 未読を対象にできたか（false なら直近の発言をまとめている） */
  fromUnread: boolean
  sections: SummarySection[]
}

const DECISION = /(決まりました|確定|了解|承知|対応します|対応中|完了|更新しました|しました。)/
const ACTION = /(お願い|ください|でしょうか|ですか|確認|回答|未回答|調整|教えて)/

export function buildAiSummary(
  messages: Message[],
  viewerId: string,
  /**
   * ルームを開いた時点で未読だったメッセージのID。
   * ルームを開くと即座に既読になるため、開いた瞬間の未読をここで受け取らないと
   * 「未読◯件を要約」が常に0件になる。
   */
  unreadIds?: readonly string[],
): AiSummaryResult {
  // 過去のAI要約を材料に含めると「要約の要約」になり、原文から離れていく
  const readable = messages.filter(
    (m) => !m.deleted && m.type !== 'system' && m.type !== 'ai' && m.senderId !== AI_USER_ID,
  )
  const target = unreadIds
    ? readable.filter((m) => unreadIds.includes(m.id))
    : readable.filter((m) => m.senderId !== viewerId && !m.readUserIds.includes(viewerId))
  // 未読が無いときは直近の発言をまとめる
  const source = target.length > 0 ? target : readable.slice(-10)

  const important: SummarySection['items'] = []
  const decisions: SummarySection['items'] = []
  const actions: SummarySection['items'] = []
  const info: SummarySection['items'] = []

  for (const m of source) {
    const who = getUser(m.senderId).name
    const flat = m.body.replace(/\s+/g, ' ').trim()
    // 途中で切れたことが分かるように「…」を付ける（切れた文が AI の作文に見えないように）
    const quoted = flat.length > 90 ? `${flat.slice(0, 90)}…` : flat
    const text = (m.title ? `${m.title}：` : '') + quoted
    const item = { text, who }
    if (m.priority === 'emergency' || m.priority === 'important') important.push(item)
    else if (ACTION.test(m.body)) actions.push(item)
    else if (DECISION.test(m.body)) decisions.push(item)
    else info.push(item)
  }

  const sections: SummarySection[] = [
    { heading: '重要', items: important },
    { heading: '決定事項', items: decisions },
    { heading: '対応が必要', items: actions },
    { heading: '参考情報', items: info },
  ].filter((s) => s.items.length > 0)

  return { targetCount: source.length, fromUnread: target.length > 0, sections }
}
