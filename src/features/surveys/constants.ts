/** アンケート機能だけで使う表示用の定数 */
import type { SurveyQuestionType } from '@/types'

export const QUESTION_TYPE_LABEL: Record<SurveyQuestionType, string> = {
  single: '単一選択',
  multiple: '複数選択',
  text: '自由記述',
  scale: '5段階評価',
}

/** 5段階評価の選択肢 */
export const SCALE_VALUES = [1, 2, 3, 4, 5] as const

/** 数字の意味は質問文に委ねる（質問ごとに尺度が違うため） */
export const SCALE_HINT = '1 〜 5 から選んでください'
