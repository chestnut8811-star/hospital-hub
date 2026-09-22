/**
 * 永続化したデモ状態が「いつの日付で作られたか」を判定する。
 * 日付が変わったらモックを作り直し、常に「今日の会話」に見えるようにする。
 */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
