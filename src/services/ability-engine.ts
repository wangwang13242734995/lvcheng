import { prisma } from '@/lib/prisma';

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(value, min), max);
}

export async function calculateAbilityScores(userId: string) {
  const [projects, growthRecords] = await Promise.all([
    prisma.project.findMany({ where: { userId } }),
    prisma.growthRecord.findMany({ where: { userId } }),
  ]);

  // 专业力 (Craft): 项目数量 x 复杂度权重 + 技术栈广度 + 成果量化
  const projectCount = projects.length;
  const complexityWeight = projects.reduce((acc, p) => {
    let weight = 1;
    if (p.difficulty) weight += 0.5;
    if (p.outcome) weight += 0.3;
    if (p.outcomeType) weight += 0.2;
    return acc + weight;
  }, 0);
  const allTechs = new Set<string>();
  projects.forEach(p => {
    if (p.techStack) {
      try {
        const techs: string[] = JSON.parse(p.techStack);
        techs.forEach(t => allTechs.add(t));
      } catch {}
    }
  });
  const techBreadth = allTechs.size;
  const quantifiedOutcome = projects.filter(p => p.outcomeType === 'QUANTIFIED').length;
  const craft = clamp(30 + projectCount * 5 + complexityWeight * 3 + techBreadth * 2 + quantifiedOutcome * 5);

  // 学习力 (Learn): 跨领域项目比例 + 新技术采纳 + 从零到产出周期
  const projectTypes = new Set(projects.map(p => p.type));
  const crossDomainRatio = projectTypes.size / 5; // 5 types total
  const newSkillRecords = growthRecords.filter(r => r.type === 'NEW_SKILL').length;
  const learn = clamp(30 + crossDomainRatio * 20 + newSkillRecords * 5 + techBreadth * 1.5);

  // 自驱力 (Drive): 个人项目比例 + 持续记录天数 + 课外投入
  const personalProjects = projects.filter(p => p.type === 'PERSONAL' || p.type === 'CHALLENGE').length;
  const personalRatio = projectCount > 0 ? personalProjects / projectCount : 0;
  const uniqueDays = new Set(growthRecords.map(r => r.date.toDateString())).size;
  const drive = clamp(30 + personalRatio * 25 + uniqueDays * 2 + personalProjects * 4);

  // 协作力 (Team): 团队项目次数 + 角色多样性
  const teamProjects = projects.filter(p => p.teamSize && p.teamSize > 1).length;
  const roles = new Set(projects.map(p => p.role).filter(Boolean));
  const team = clamp(30 + teamProjects * 6 + roles.size * 5 + (teamProjects > 0 ? 10 : 0));

  // 抗压力 (Grit): 有"困难+解决"记录的项目比例 + 长周期项目完成率
  const projectsWithDifficulty = projects.filter(p => p.difficultyEncountered && p.solution).length;
  const gritRatio = projectCount > 0 ? projectsWithDifficulty / projectCount : 0;
  const completedProjects = projects.filter(p => p.status === 'PUBLISHED' && p.endDate).length;
  const completionRate = projectCount > 0 ? completedProjects / projectCount : 0;
  const grit = clamp(30 + gritRatio * 30 + completionRate * 20 + projectsWithDifficulty * 5);

  // 表达力 (Express): 记录的结构化程度 + 描述清晰度 + 视频展示
  const projectsWithDesc = projects.filter(p => p.description && p.description.length > 50).length;
  const descRatio = projectCount > 0 ? projectsWithDesc / projectCount : 0;
  const structuredRecords = growthRecords.filter(r => r.content && r.content.length > 30).length;
  const projectsWithVideo = projects.filter(p => p.videoUrl).length;
  const videoBonus = projectsWithVideo * 8; // 有视频的项目每个加 8 分
  const express = clamp(30 + descRatio * 25 + structuredRecords * 3 + (projectsWithDesc > 0 ? 10 : 0) + videoBonus);

  const totalScore = Math.round((craft + learn + drive + team + grit + express) / 6);

  // Save new ability score
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
