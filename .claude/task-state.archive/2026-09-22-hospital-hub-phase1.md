# タスク状態

- Status: done
- 目的: 院内コミュニケーションハブ（チャット＋院内業務ポータル）のフロントエンドプロトタイプを Phase 1 として完成させる
- 成果物: /Users/hagemaru/Desktop/AI開発/10_Private/Chatis

## Summary

Phase 1（UIプロトタイプ）完了。21ルート・9機能をモックデータだけで操作できる状態。
build / lint / 型チェックともエラー0、本番ビルドを 375px と 1440px で確認済み（コンソールエラー0）。
残課題は「設計指示より小さいフォント・タッチターゲットの一部」「バンドル分割」「グループのメンバー管理UI」など、
いずれもユーザー判断待ちの項目として docs/design.md §11 に記載。

## Decisions

- 2026-09-22 バックエンドは作らず `src/repositories/hubRepository.ts` で抽象化（閉域網で Supabase が使えない可能性に備える）。現状の形では差し替えできないため、必要な作業を docs/design.md §4 に明記
- 2026-09-22 shadcn/ui（radix-nova）を導入し、ボタン・入力・メニューを44pxに、角丸12pxに調整
- 2026-09-22 設計指示 §21 の Danger/Warning/Success/Sub text は WCAG AA 未達だったため、文字・塗り用に暗い色へ変更し、罫・アイコン用に元の色を `*-accent` として残した
- 2026-09-22 要件の「最小フォント14px」に合わせ、Tailwind 既定の `--text-xs`(12px) を 0.875rem に上書き。戻すときは index.css の1行を削る
- 2026-09-22 AI要約は文章を創作せず、実メッセージを分類して原文のまま並べ直す。過去のAI発言は材料にしない
- 2026-09-22 モックの AI 発言（m-tavi-04）が創作文だったため、原文引用の形に書き直した（アプリの説明と矛盾していた）
- 2026-09-22 一覧・検索・マイルームは自分が memberIds に入っているルームだけに限定。お知らせ・アンケートは配信対象（自分が配信したものは対象外でも表示）で絞る
- 2026-09-22 保存データは `seededOn`（日付）と `SEED_REVISION`（モックの版）で破棄判定。persist に version:1 と migrate を明示

## Progress

- [x] Phase 0 要件定義 `docs/requirements.md`
- [x] Phase 2 設計 `docs/design.md`
- [x] T0 基盤（トークン・型・モックデータ・ストア・レイアウト・共通部品・ルート）
- [x] T1 チャット（メインセッション）
- [x] T2 メニュー・お知らせ・安否・アンケート（サブエージェント）
- [x] T3 ナレッジ・AI・機器トラブル（サブエージェント）
- [x] T4 ログイン・管理（サブエージェント）
- [x] Phase 4 統合検証: `npm run build` 成功 / `npm run lint` エラー0（警告6）/ `tsc --noEmit` エラー0
      本番ビルドを静的配信して 18〜21 ルートを 375px で巡回 → 横スクロール0・描画エラー0・コンソールエラー0
- [x] Phase 5 独立レビュー（別セッション4本が並行実施）: 重大1・中22・軽微31＋追加分を受領し、
      要件未達・不具合はすべて修正。設計判断の項目は docs/design.md §11 に残課題として記載

## Findings

- Vite の新テンプレートは oxlint。TypeScript 6 では `baseUrl` が非推奨エラーになるため paths のみで運用
- Desktop が iCloud 同期対象のため `node_modules` に `com.apple.fileprovider.ignore#P` を付与
- zustand v5 はセレクタで新配列を返すと無限ループ。「生配列を select → useMemo で絞る」を徹底
- Radix の DropdownMenuTrigger は pointerdown で開くため、吹き出し全体をトリガにすると軽いタップで開く。
  見えないアンカーをトリガにし、開閉は長押し・右クリック・キーボードから行う
- shadcn の DialogContent 既定は `max-w-[calc(100%-2rem)] sm:max-w-sm`。className に素の `max-w-*` を渡すと
  スマホの余白指定まで打ち消され 375px で全幅になる。必ず `sm:max-w-*` で渡す
- flex の子要素は `min-w-0` が無いと中身の幅まで広がる（375px で一覧ペインが 738px になっていた）

## Next steps（Phase 2 以降）

1. ユーザー判断: 補助情報のフォントサイズ（14px 統一のままにするか、12px を許容するか）
2. ユーザー判断: グループのメンバー管理・部署管理のUIを作るか
3. 配信先（院内サーバのパス）を決めて `vite.config.ts` の `base` と SPA フォールバックを設定
4. Phase 2 認証 → Phase 3 DB（Supabase か院内 PocketBase）。`docs/design.md` §4 の3項目を実施
