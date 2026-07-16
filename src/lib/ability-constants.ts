/**
 * 能力评估系统常量
 * 集中管理基础分、阈值等参数，避免散落在多个文件导致不一致
 */

/** 零作品时的基础分（维度分） */
export const ABILITY_BASE_SCORE = 10;

/** 零作品时的综合分 */
export const ABILITY_TOTAL_BASE_SCORE = 10;

/** 默认能力分数（用于未计算过能力的用户） */
export const DEFAULT_ABILITY_SCORES = {
  craft: ABILITY_BASE_SCORE,
  learn: ABILITY_BASE_SCORE,
  drive: ABILITY_BASE_SCORE,
  team: ABILITY_BASE_SCORE,
  grit: ABILITY_BASE_SCORE,
  express: ABILITY_BASE_SCORE,
  totalScore: ABILITY_TOTAL_BASE_SCORE,
} as const;
