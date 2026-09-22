/**
 * AI アシスタントのモック応答（設計書 §13）。
 *
 * バックエンドが無いため、応答は「院内ナレッジのどの記事に書かれているか」の案内に限定する。
 * 手順・設定値・臨床判断を AI が文章として生成することは絶対にしない。
 */
import { matchesQuery, normalize } from '@/lib/search'
import type { KnowledgeDoc } from '@/types'

/** 1 回の応答で案内する記事の上限 */
const MAX_HITS = 3

export interface AiAnswer {
  /** AI が話す固定文 */
  text: string
  /** 案内する院内ナレッジ記事。空なら「見つからなかった」応答 */
  docs: KnowledgeDoc[]
}

/**
 * 質問文に関連するナレッジ記事を探す。
 *
 * 形態素解析を持たないので「質問文の中に記事側の語（タグ・カテゴリー）が現れるか」を見る。
 * 単語だけを入力されたときや、記事タイトルから遷移してきたとき（`?q=<タイトル>`）は
 * 通常のあいまい検索（`matchesQuery`）でも拾う。
 */
function findRelatedDocs(question: string, knowledge: KnowledgeDoc[]): KnowledgeDoc[] {
  const q = normalize(question)
  if (!q) return []

  return knowledge
    .map((doc) => {
      let score = 0
      // 検索語として通る場合（短い語・記事タイトルそのもの）
      if (matchesQuery(question, doc.title, doc.summary, doc.tags.join(' '), doc.category)) {
        score += 4
      }
      // 話し言葉の質問からタグ・カテゴリーを拾い上げる
      for (const tag of doc.tags) {
        const t = normalize(tag)
        if (t.length >= 2 && q.includes(t)) score += 3
      }
      const category = normalize(doc.category)
      if (category.length >= 2 && q.includes(category)) score += 2
      return { doc, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.doc.updatedAt.localeCompare(a.doc.updatedAt))
    .slice(0, MAX_HITS)
    .map((x) => x.doc)
}

/** 質問に対する応答を組み立てる。文面は固定で、記事の中身は要約しない。 */
export function buildAnswer(question: string, knowledge: KnowledgeDoc[]): AiAnswer {
  const docs = findRelatedDocs(question, knowledge)
  if (docs.length === 0) {
    return {
      text: '院内ナレッジに該当する記事が見つかりませんでした。担当部署へ確認してください。',
      docs: [],
    }
  }
  return {
    text: `院内ナレッジに関連する記事が ${docs.length} 件ありました。内容は次の記事に書かれています。`,
    docs,
  }
}
