import { prisma } from '@/lib/prisma';
import { ABILITY_BASE_SCORE } from '@/lib/ability-constants';

// ============ 工具函数 ============

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 对数收敛曲线：前快后慢，天然防止刷分
 * 公式: base + (max - base) * (1 - exp(-k * rawScore))
 *
 * 举例 (base=10, k=0.015):
 *   rawScore=0  → 10分
 *   rawScore=30 → 48分
 *   rawScore=80 → 76分
 *   rawScore=150→ 90分
 *   rawScore=300→ 98分 (接近上限，很难刷满)
 */
function logisticScore(rawScore: number, k: number = 0.015, base: number = ABILITY_BASE_SCORE, max: number = 100): number {
  const range = max - base;
  return base + range * (1 - Math.exp(-k * rawScore));
}

/**
 * 时间衰减权重：近期项目权重更高，反映当前真实能力
 */
function getTimeWeight(date: Date | null): number {
  if (!date) return 0.5;
  const months = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months <= 3) return 1.0;   // 近3个月：满分权重
  if (months <= 6) return 0.8;   // 3-6个月：80%
  if (months <= 12) return 0.6;  // 6-12个月：60%
  if (months <= 24) return 0.4;  // 1-2年：40%
  return 0.25;                    // 2年以上：25%
}

/**
 * 难度系数：高难度项目得分加成
 */
function getDifficultyMultiplier(difficulty: string | null): number {
  switch (difficulty?.toUpperCase()) {
    case 'EXPERT': return 2.0;
    case 'HARD': return 1.5;
    case 'MEDIUM': return 1.0;
    case 'EASY': return 0.6;
    default: return 0.8;
  }
}

/**
 * 技术栈广度：对数增长，避免堆砌技术刷分
 * 第1个技术+14分，第5个+28分，第10个+42分，第20个+56分
 */
function techBreadthScore(techCount: number): number {
  if (techCount <= 0) return 0;
  return 20 * Math.log2(techCount + 1);
}

// ============ 单项目评分 (0-100) ============

interface ProjectScore {
  completeness: number;  // 完整度 0-25
  depth: number;         // 深度 0-30
  presentation: number;  // 展示 0-20
  difficulty: number;    // 难度 0-25
  total: number;         // 总分 0-100
}

/**
 * 给单个项目打分（0-100）
 * 四维评估：完整度25% + 深度30% + 展示20% + 难度25%
 *
 * 评分标准:
 * - 完整度: 标题(5) + 描述长度(5-10) + 技术栈(5) + 附件/链接(5)
 * - 深度: 成果描述(10) + 量化数据(10) + 困难记录(5) + 解决方案(5)
 * - 展示: 视频(10) + 外部链接(5) + 附件(5)
 * - 难度: EXPERT(25) / HARD(20) / MEDIUM(15) / EASY(10)
 */
function scoreProject(project: {
  title?: string | null;
  description?: string | null;
  techStack?: string | null;
  attachments?: string | null;
  links?: string | null;
  outcome?: string | null;
  outcomeType?: string | null;
  outcomeData?: string | null;
  difficultyEncountered?: string | null;
  solution?: string | null;
  videoUrl?: string | null;
  difficulty?: string | null;
}): ProjectScore {
  // 1. 完整度 (25分)
  let completeness = 0;
  if (project.title && project.title.trim().length > 3) completeness += 5;

  const descLen = project.description?.length || 0;
  if (descLen >= 300) completeness += 10;
  else if (descLen >= 100) completeness += 7;
  else if (descLen >= 50) completeness += 5;
  else if (descLen > 0) completeness += 2;

  if (project.techStack) {
    try {
      const techs = JSON.parse(project.techStack);
      if (Array.isArray(techs) && techs.length > 0) completeness += 5;
    } catch {
      // 解析失败则不加分
    }
  }

  if (project.attachments || project.links) completeness += 5;

  // 2. 深度 (30分)
  let depth = 0;
  const outcomeLen = project.outcome?.length || 0;
  if (outcomeLen >= 100) depth += 10;
  else if (outcomeLen >= 30) depth += 7;
  else if (outcomeLen > 0) depth += 4;

  if (project.outcomeType === 'QUANTIFIED' || project.outcomeData) depth += 10;

  const diffLen = project.difficultyEncountered?.length || 0;
  if (diffLen >= 50) depth += 5;
  else if (diffLen > 10) depth += 3;
  else if (diffLen > 0) depth += 1;

  const solLen = project.solution?.length || 0;
  if (solLen >= 50) depth += 5;
  else if (solLen > 10) depth += 3;
  else if (solLen > 0) depth += 1;

  // 3. 展示 (20分)
  let presentation = 0;
  if (project.videoUrl && project.videoUrl.length > 5) presentation += 10;
  if (project.links && project.links.length > 5) presentation += 5;
  if (project.attachments && project.attachments.length > 5) presentation += 5;

  // 4. 难度 (25分)
  let difficultyScore = 0;
  switch (project.difficulty?.toUpperCase()) {
    case 'EXPERT': difficultyScore = 25; break;
    case 'HARD': difficultyScore = 20; break;
    case 'MEDIUM': difficultyScore = 15; break;
    case 'EASY': difficultyScore = 10; break;
    default: difficultyScore = 12;
  }

  const total = clamp(completeness + depth + presentation + difficultyScore);
  return { completeness, depth, presentation, difficulty: difficultyScore, total };
}

// ============ 用户六维能力计算 ============

export async function calculateAbilityScores(userId: string) {
  // 只统计已发布的项目，草稿不计入能力评估
  const [projects, growthRecords] = await Promise.all([
    prisma.project.findMany({ where: { userId, status: 'PUBLISHED' } }),
    prisma.growthRecord.findMany({ where: { userId } }),
  ]);

  // 给所有项目打分并附加权重
  const scoredProjects = projects.map((project) => ({
    project,
    score: scoreProject(project),
    timeWeight: getTimeWeight(project.createdAt),
    difficultyMultiplier: getDifficultyMultiplier(project.difficulty),
  }));

  // 提取所有技术栈（去重）
  const allTechs = new Set<string>();
  projects.forEach((p) => {
    if (p.techStack) {
      try {
        const techs: string[] = JSON.parse(p.techStack);
        techs.forEach((t) => allTechs.add(t.toLowerCase().trim()));
      } catch {
        // 忽略解析失败
      }
    }
  });

  const projectCount = projects.length;
  const completedProjects = projects.filter((p) => p.endDate).length;
  const completionRate = projectCount > 0 ? completedProjects / projectCount : 0;

  // ========== 1. 专业力 (Craft) ==========
  // 核心：项目质量 × 时间权重 × 难度系数 + 技术栈广度
  const craftRaw = scoredProjects.reduce((sum, sp) => {
    return sum + sp.score.total * sp.timeWeight * sp.difficultyMultiplier;
  }, 0);
  const craft = logisticScore(craftRaw + techBreadthScore(allTechs.size));

  // ========== 2. 学习力 (Learn) ==========
  // 核心：跨领域项目 + 新技能记录 + 技术多样性
  const projectTypes = new Set(projects.map((p) => p.type));
  const crossDomainBonus = projectTypes.size * 8;
  const newSkillCount = growthRecords.filter((r) => r.type === 'NEW_SKILL').length;

  const learnRaw = scoredProjects.reduce((sum, sp) => {
    // 学习力更看重技术栈和项目类型多样性
    let techBonus = 0;
    if (sp.project.techStack) {
      try {
        const techs: string[] = JSON.parse(sp.project.techStack);
        techBonus = Math.min(techs.length * 3, 15); // 单个项目技术栈奖励上限15
      } catch {
        techBonus = 0;
      }
    }
    return sum + (sp.score.completeness * 0.5 + techBonus) * sp.timeWeight;
  }, 0);
  const learn = logisticScore(learnRaw + crossDomainBonus + newSkillCount * 6);

  // ========== 3. 自驱力 (Drive) ==========
  // 核心：个人项目比例 + 持续记录天数 + 主动发起
  const personalProjects = projects.filter(
    (p) => p.type === 'PERSONAL' || p.type === 'CHALLENGE'
  ).length;
  const uniqueDays = new Set(growthRecords.map((r) => r.date.toDateString())).size;

  const driveRaw = scoredProjects.reduce((sum, sp) => {
    const personalBonus =
      sp.project.type === 'PERSONAL' || sp.project.type === 'CHALLENGE' ? 12 : 0;
    return sum + personalBonus * sp.timeWeight;
  }, 0);
  const drive = logisticScore(driveRaw + uniqueDays * 3 + personalProjects * 5);

  // ========== 4. 协作力 (Team) ==========
  // 核心：团队项目 + 角色多样性
  const teamProjects = projects.filter((p) => p.teamSize && p.teamSize > 1).length;
  const roles = new Set(projects.map((p) => p.role).filter(Boolean));

  const teamRaw = scoredProjects.reduce((sum, sp) => {
    const teamBonus = sp.project.teamSize && sp.project.teamSize > 1 ? 18 : 0;
    const roleBonus = sp.project.role ? 6 : 0;
    return sum + (teamBonus + roleBonus) * sp.timeWeight;
  }, 0);
  const team = logisticScore(teamRaw + roles.size * 8 + (teamProjects > 0 ? 5 : 0));

  // ========== 5. 抗压力 (Grit) ==========
  // 核心：困难解决记录 + 项目完成率 + 长周期项目
  const gritRaw = scoredProjects.reduce((sum, sp) => {
    // 深度分中的困难与解决记录
    const difficultyBonus = sp.score.depth;
    // 完成项目额外加分
    const completionBonus = sp.project.endDate ? 6 : 0;
    return sum + (difficultyBonus + completionBonus) * sp.timeWeight;
  }, 0);
  const grit = logisticScore(gritRaw + completionRate * 25);

  // ========== 6. 表达力 (Express) ==========
  // 核心：展示质量 + 描述完整度 + 结构化记录
  const expressRaw = scoredProjects.reduce((sum, sp) => {
    return sum + (sp.score.presentation + sp.score.completeness * 0.6) * sp.timeWeight;
  }, 0);
  const structuredRecords = growthRecords.filter(
    (r) => r.content && r.content.length > 50
  ).length;
  const express = logisticScore(expressRaw + structuredRecords * 4);

  // 综合分：六维平均
  const totalScore = Math.round((craft + learn + drive + team + grit + express) / 6);

  // 保存新的能力评分记录
  await prisma.abilityScore.create({
    data: {
      userId,
      craft: Math.round(craft),
      learn: Math.round(learn),
      drive: Math.round(drive),
      team: Math.round(team),
      grit: Math.round(grit),
      express: Math.round(express),
      totalScore: Math.round(totalScore),
    },
  });

  return { craft, learn, drive, team, grit, express, totalScore };
}

export async function getLatestAbilityScore(userId: string) {
  const score = await prisma.abilityScore.findFirst({
    where: { userId },
    orderBy: { calculatedAt: 'desc' },
  });
  return score;
}

export async function getAbilityHistory(userId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const scores = await prisma.abilityScore.findMany({
    where: {
      userId,
      calculatedAt: { gte: since },
    },
    orderBy: { calculatedAt: 'asc' },
  });

  return scores;
}
