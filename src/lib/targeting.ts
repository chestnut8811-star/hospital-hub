/**
 * お知らせ・アンケートの配信対象の判定（要件 §3.1、設計書 §11 §16）。
 *
 * `targets` は配信先の部署名の配列で、`['全職員']` なら全体配信。
 * 一覧・未読件数・回答可否で同じ判定を使い、
 * 「画面によって見える／見えないが違う」状態を作らないためにここへ集約する。
 */

/** 全体配信を表す予約語。モックデータと作成ダイアログで使う文字列と同じもの。 */
export const ALL_STAFF = '全職員'

/**
 * `department` の職員が配信対象に含まれるか。
 *
 * 対象が空配列のときは全体配信として扱う。
 * 配信先を選び損ねたお知らせが誰にも届かないより、全員に見えるほうが院内運用では安全。
 */
export function isTargeted(targets: string[], department: string | undefined): boolean {
  if (targets.length === 0 || targets.includes(ALL_STAFF)) return true
  return department !== undefined && targets.includes(department)
}

/**
 * 自分の一覧に出すかどうか。
 *
 * 配信対象に含まれていれば出す。加えて、自分が配信したものは
 * 対象部署に自分が入っていなくても出す（配信した本人が自分の一覧で
 * 見つけられないと、配信したこと自体を確認できないため）。
 */
export function isVisibleToUser(
  item: { targets: string[]; authorId: string },
  user: { id: string; department: string },
): boolean {
  return item.authorId === user.id || isTargeted(item.targets, user.department)
}
