# タスク状態

- Status: in_progress（Phase 4 統合検証 → Phase 5 レビュー中）
- 目的: 院内コミュニケーションハブ（チャット＋院内業務ポータル）のフロントエンドプロトタイプを Phase 1 として完成させる
- 完了条件: `npm run build` 成功 / oxlint エラー0 / 主要導線を実機（ブラウザ）で確認 / 独立レビューの重大指摘0
- 成果物の場所: /Users/hagemaru/Desktop/AI開発/10_Private/Chatis

## Decisions

- 2026-09-22 バックエンドは作らず `src/repositories/hubRepository.ts` で抽象化。Supabase / 院内PocketBase のどちらでも差し替えられるようにする（閉域網で Supabase が使えない可能性があるため）
- 2026-09-22 shadcn/ui は CLI（radix-nova プリセット）で導入。ボタン・入力の高さを44pxに引き上げ、角丸12px、病院配色に上書き（設計書 §21 §22）
- 2026-09-22 設計書の warning #E89C31 は白文字とのコントラストが AA 未満のため、塗り・文字用に `--warning: #b9701a`、装飾用に `--warning-accent: #e89c31` の2トークンに分割
  - 【要修正】#b9701a + 白文字 = 3.89:1 で AA 4.5 に**まだ届いていない**（後述 Findings）
- 2026-09-22 モックの日時は基準日 2026-09-22 の ISO で持ち、`src/mock/seed.ts` が読み込み時に当日へシフト。保存済みデータは日付が変わったら破棄して作り直す（各ストアの `seededOn` + `merge` で実装済みを確認）
- 2026-09-22 AI要約は文章を創作せず、実メッセージを分類して原文のまま並べ直す実装にした（医療現場で使うため）
- 2026-09-22 臨床寄りのナレッジ記事本文は意図的にプレースホルダ。一次資料参照と明記する
- 2026-09-22 実装は4系統に分割（T1 チャット＝メイン、T2 メニュー/お知らせ/安否/アンケート、T3 ナレッジ/AI/トラブル、T4 ログイン/管理）

## Progress

- [x] Phase 0 要件定義 `docs/requirements.md`
- [x] Phase 2 設計 `docs/design.md`
- [x] T0 基盤 / T1 チャット / T2 / T3 / T4 実装ファイルはすべて存在
- [x] Phase 4 統合検証（自分で実行して確認済み）
      - `npm run build` 成功（tsc -b + vite build。dist/assets/index.js 1,009 kB / gzip 294 kB）
      - `npm run lint` エラー0・warning 5件（only-export-components 3、set-state-in-effect 2）
      - 外部通信ゼロを機械確認: src/dist に外部ホストへの fetch / XHR / link / @import / url() なし。
        フォントは woff2 をバンドル。dist 内の github.com 等はライブラリのエラーメッセージ文字列のみ
      - 実機（Chromium, 1440px / 375px）で全ルート表示・コンソールエラーなし（favicon 404 を除く）
      - 受け入れ条件2・3 を実機で確認（送信 → 一覧の最終メッセージと時刻が 14:17 に更新 / 未読バッジ消滅）
      - 永続化キー `hch.chat.v1` `hch.session.v1` の書き込みを実機で確認。`seededOn` による日次破棄も実装済み
- [ ] Phase 5 独立レビュー（サブエージェント3件 実施中：①データ層・状態管理 ②チャット＋レイアウト ③業務機能・管理画面・医療制約）

## Findings（今セッションで自分が確認した分）

- 【高・要再現確認】前セッションのブラウザログ `.playwright-mcp/console-2026-09-22T05-05-52-808Z.log` に
  `React has detected a change in the order of Hooks` → `TypeError: Cannot read properties of null (reading 'getSnapshot')`
  が記録され、React Router の ErrorBoundary に落ちている。今セッションの全ルート表示＋チャット送信では再現せず、
  oxlint の `react/rules-of-hooks` も error 設定で0件。**操作の組み合わせでのみ出る可能性が残るため未解決扱い**
- 【中】WCAG AA 未達のトークン（計算値）:
  `--warning #b9701a`+白 3.89 / `--success #2f9e6f`+白 3.36 / `--destructive #d64545`+白 4.38 /
  `--muted-foreground #717784` on `--background` 4.19（本文 4.5 未満）
  非テキスト3:1（SC 1.4.11）: `--input #d5dae5` on 白 = 1.40（Input/Textarea/Checkbox の枠）、
  `--border #e1e5ee` = 1.18（outline ボタンの枠）
  → 推奨値: warning `#aa6718` / success `#28865e` / destructive `#d54141` / muted-foreground `#6c727f` /
    入力枠は `#8795b5` 相当まで濃くする
- 【中】375px 実測：横スクロールなし。ただし
  タッチターゲット44px未満 = ルーム行の「…の操作」ボタン 36×36px（一覧の全行）、リアクションボタン 44×28px、
  ヘッダーのロゴボタン 108×40px。
  最小フォント14px未満 = `text-[11px]`（「長押し（PC は右クリック）で…」ヒント）、`text-xs`(12px)（メッセージ時刻、
  ボトムナビのラベル、デモ注意書き）
- 【中】`base` 未設定・`createBrowserRouter` のため、サブパス配信（例 `/hub/`）や SPA フォールバック未設定の
  静的配信でディープリンクが 404 になる。院内配信先が決まったら `vite.config.ts` の `base` と Caddy 側の rewrite が必要
- 【低】`index.html` に favicon の link が無く `/favicon.ico` 404。`public/favicon.svg` `public/icons.svg` は未参照
- 【低】`next-themes` の `ThemeProvider` が存在しないのに `sonner.tsx` が `useTheme()` を使い `theme="system"` で動く。
  OS がダークだとトーストだけ暗くなる（アプリ本体はライト固定）。設計 P5 に合わせ `theme="light"` 固定が筋
- 【低】`clsx` `tailwind-merge` が package.json に残っているが未使用（`cn` パッケージに置き換わっている）
- 【要注意】`.playwright-mcp/groups-375.png` と `groups-375-fixed.png` がバイト一致。前セッションの 375px 修正は
  この画面に効いていない
- Vite の新テンプレートは eslint ではなく oxlint。TypeScript 6 では `baseUrl` が非推奨エラーになるため paths のみで運用する
- Desktop が iCloud 同期対象のため、`node_modules` に `com.apple.fileprovider.ignore#P` 属性を付けて同期から除外済み
- zustand v5 はセレクタで新しい配列を返すと useSyncExternalStore が無限ループする。「生配列を select → useMemo で絞る」を徹底

## Next steps

1. サブエージェント3件のレビュー結果を統合し、重大度順の修正リストを作る
2. 「Hooks 順序変更」クラッシュの再現条件を特定する（未解決）
3. トークンのコントラスト修正（`src/index.css` の1ファイルで完結）
4. 44px / 14px の未達箇所の修正
5. 配信先確定後に `base` と SPA フォールバックを決める

## 環境メモ

- dev サーバは `/usr/local/bin/node` の npm で起動する。既定 node が Codex 同梱版だと Vite が落ちる
- 今セッションで 5180 / 5181 に残っていた旧 dev サーバと、Playwright の残存 Chrome を停止済み。現在は 5182 で起動中
