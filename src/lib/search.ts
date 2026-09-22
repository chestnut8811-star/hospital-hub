/**
 * 院内利用を想定した簡易あいまい検索。
 * 全角/半角・大文字小文字・カタカナ/ひらがなの違いを吸収する。
 * 形態素解析は入れない（プロトタイプに対して重すぎるため）。
 */

function katakanaToHiragana(input: string): string {
  return input.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  )
}

export function normalize(input: string): string {
  return katakanaToHiragana(input.normalize('NFKC').toLowerCase()).trim()
}

/** 空白区切りのすべての語を含むか（AND検索） */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = normalize(query)
  if (!q) return true
  const haystack = normalize(fields.filter(Boolean).join(' '))
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

/**
 * ヒット箇所で分割する。ハイライト表示用。
 *
 * 正規化（NFKC・小文字化・カタカナ→ひらがな）は文字数を変えることがあるため
 * （例: 半角カナ「ﾊﾞ」は2文字→1文字、全角空白の trim）、
 * 正規化後の位置をそのまま元テキストに使うとハイライトがずれる。
 * ここでは1文字ずつ正規化して、元テキストの位置との対応表を作る。
 */
function buildIndexMap(text: string): { norm: string; starts: number[]; ends: number[] } {
  let norm = ''
  const starts: number[] = []
  const ends: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    let chunk = text[i]
    // 半角カナの濁点・半濁点は直前の文字と合わせて1文字になる
    const next = text[i + 1]
    if (next === '\uff9e' || next === '\uff9f') {
      chunk += next
      i += 1
    }
    const normalized = normalize(chunk)
    for (const ch of normalized) {
      norm += ch
      starts.push(chunk.length > 1 ? i - 1 : i)
      ends.push(i + 1)
    }
  }
  return { norm, starts, ends }
}

export function splitHighlight(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return [{ text, hit: false }]

  const { norm, starts, ends } = buildIndexMap(text)
  const ranges: [number, number][] = []
  for (const term of terms) {
    let from = 0
    for (;;) {
      const at = norm.indexOf(term, from)
      if (at === -1) break
      ranges.push([starts[at], ends[at + term.length - 1]])
      from = at + term.length
    }
  }
  if (ranges.length === 0) return [{ text, hit: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }

  const out: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), hit: false })
    out.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false })
  return out
}
