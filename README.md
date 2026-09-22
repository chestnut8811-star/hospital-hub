# 院内ハブ / Hospital Communication Hub

院内職員向けのチャット＋業務ポータル Web アプリ。**Phase 1（UI プロトタイプ）**。
バックエンドは持たず、モックデータと Zustand だけで実際に操作できます。

> 表示されるデータはすべて架空です。実在の患者情報・職員情報は含みません。
> 臨床判断には使用しないでください。

## 動かす

```bash
npm install
npm run dev      # http://localhost:5180
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 型チェック（tsc -b）＋本番ビルド |
| `npm run preview` | ビルド結果の確認 |
| `npm run lint` | oxlint |

ログイン画面で「デモ用：利用者を選んでログイン」から職員を選ぶと、その権限での見え方に切り替わります。
ヘッダー右のアバター →「利用者を切り替え」でも変更できます。「デモデータを初期化」で操作結果を消せます。

## 画面

| ルート | 画面 |
|---|---|
| `/login` | ログイン（デモ用アカウント選択） |
| `/groups` `/direct` | チャット一覧（タブ1・タブ2） |
| `/chat/:roomId` | チャット |
| `/chat/:roomId/note` | 共有ノート・ファイル・画像 |
| `/menu` | メニュー（タブ3） |
| `/myroom` | マイルーム（自分専用チャット） |
| `/knowledge` `/knowledge/:docId` | 院内ナレッジ |
| `/ai` | AI アシスタント |
| `/trouble` `/trouble/new` `/trouble/:id` | 機器トラブル報告 |
| `/announcements` `/announcements/:id` | お知らせ |
| `/safety` | 安否確認 |
| `/surveys` `/surveys/:id` | アンケート |
| `/admin` `/admin/:section` | 管理画面 |

## 構成

```
docs/requirements.md   要件定義書（受け入れ条件つき）
docs/design.md         設計書（担当範囲・表示の決まり）
src/
  index.css            デザイントークン（色・角丸・影はここだけ）
  types/index.ts       ドメイン型（唯一の定義）
  data/*.json          モックデータ（基準日 2026-09-22）
  mock/seed.ts         読み込み時に日時を当日へシフト
  repositories/        データ取得の抽象（Phase 3 でバックエンドに差し替え）
  stores/              Zustand（localStorage 永続化）
  components/ui/       shadcn/ui
  components/layout/   AppShell / ヘッダー / 下部ナビ / サイドバー
  components/common/   共通表示部品
  features/            画面（chat / home / announcements / safety / surveys /
                             knowledge / trouble / auth / admin）
```

## 設計の要点

- **外部通信ゼロ**。フォント（Geist Variable）を含め依存はすべて npm 同梱。CDN・解析タグを持たない
- **モバイルファースト**。スマホは 下部ナビ3タブ、PC（lg 以上）は サイドバー＋2ペイン
- **AI と人間を必ず区別**。AI 発言は紫の吹き出し＋🤖＋「AI アシスタント」ラベル
- **AI は文章を創作しない**。要約はルーム内の発言を分類して原文のまま並べ直すだけ
- **重要メッセージは通常チャットと分離**。緊急=赤／重要=橙の枠と「確認しました」ボタン、確認人数の表示
- **タッチターゲット 44px 以上・本文 15px**。色だけで情報を伝えない

## Phase 2 以降

認証 → DB → リアルタイム → ファイルアップロード → プッシュ通知 → 院内ナレッジ（RAG）→ AI → 管理。
バックエンドを繋ぐときは `src/repositories/hubRepository.ts` の実装を追加し、
ストアの初期化をそこから読むように差し替えます。画面側の変更は不要な構成にしてあります。
