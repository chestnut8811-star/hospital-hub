/**
 * 日時とテキストの整形。表示の揺れを防ぐため、画面側で toLocaleString を直接呼ばない。
 */
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
} from 'date-fns'
import { ja } from 'date-fns/locale'

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** チャット一覧の右肩。今日は "12:45"、昨日は "昨日"、それ以前は "9/20" */
export function formatListTime(value: string | Date): string {
  const d = toDate(value)
  const now = new Date()
  if (isSameDay(d, now)) return format(d, 'HH:mm')
  const diff = differenceInCalendarDays(now, d)
  if (diff === 1) return '昨日'
  if (diff < 7) return format(d, 'EEEE', { locale: ja })
  return format(d, 'M/d')
}

/** 吹き出しの時刻 "10:12" */
export function formatBubbleTime(value: string | Date): string {
  return format(toDate(value), 'HH:mm')
}

/** チャットの日付区切り "2026年9月22日(火)" / 今日・昨日 */
export function formatDateSeparator(value: string | Date): string {
  const d = toDate(value)
  const now = new Date()
  if (isSameDay(d, now)) return '今日'
  if (differenceInCalendarDays(now, d) === 1) return '昨日'
  return format(d, 'yyyy年M月d日(E)', { locale: ja })
}

/** "9月22日 12:45" */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), 'M月d日 HH:mm', { locale: ja })
}

/** "2026/09/22 12:45" 監査ログなど厳密に出したいとき */
export function formatFullDateTime(value: string | Date): string {
  return format(toDate(value), 'yyyy/MM/dd HH:mm')
}

/** "3分前" */
export function formatRelative(value: string | Date): string {
  return formatDistanceToNowStrict(toDate(value), { addSuffix: true, locale: ja })
}

/** 一覧のプレビュー用に改行を潰して短く切る */
export function truncate(text: string, max = 60): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

/** 99件を超える未読は "99+" */
export function formatBadgeCount(n: number): string {
  return n > 99 ? '99+' : String(n)
}
