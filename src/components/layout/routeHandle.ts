/** ルートごとのレイアウト指定。react-router の `handle` に渡す。 */
export interface RouteHandle {
  /** スマホでは全画面表示にする（共通ヘッダーと下部ナビを隠す）。チャット画面で使う */
  fullscreenOnMobile?: boolean
}
