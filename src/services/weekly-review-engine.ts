// 周复盘引擎 - 自动生成用户本周成长总结

import { prisma } from '@/lib/prisma';

export interface WeeklyReview {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  projects: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
    }>;
  };
  growthRecords: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      type: string;
      date: Date;
    }>;
  };
  abilityChanges: {
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
    biggestGain: { key: string; label: string; value: number };
    totalScoreChange: number;
  };
  summary: string;
  highlights: string[];
}

const ABILITY_LABELS: Record<string, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  const start = new Date(now);
  start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const month = start.getMonth() + 1;
  const day = start.getDate();
  const label = `${month}月${day}日 这周`;

  return { start, end, label };
}

export async function generateWeeklyReview(userId: string): Promise<WeeklyReview | null> {
  const { start, end, label } = getWeekRange();

  // Get this week's data
  const [projects, growthRecords, currentScore, previousScores] = await Promise.all([
    prisma.project.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, type: true, createdAt: true },
    }),
    prisma.growthRecord.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
      select: { id: true, title: true, type: true, date: true },
    }),
    prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    }),
    prisma.abilityScore.findFirst({
      where: { userId, calculatedAt: { lt: start } },
      orderBy: { calculatedAt: 'desc' },
    }),
  ]);

  // Calculate ability changes
  const current = currentScore
    ? { craft: currentScore.craft, learn: currentScore.learn, drive: currentScore.drive, team: currentScore.team, grit: currentScore.grit, express: currentScore.express, totalScore: currentScore.totalScore }
    : { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };

  const previous = previousScores
    ? { craft: previousScores.craft, learn: previousScores.learn, drive: previousScores.drive, team: previousScores.team, grit: previousScores.grit, express: previousScores.express, totalScore: previousScores.totalScore }
    : { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };

  const changes: Record<string, number> = {};
  let biggestGainKey = '';
  let biggestGainValue = 0;

  for (const key of Object.keys(ABILITY_LABELS)) {
    const change = (current as any)[key] - (previous as any)[key];
    changes[key] = change;
    if (change > biggestGainValue) {
      biggestGainValue = change;
      biggestGainKey = key;
    }
  }

  const totalScoreChange = current.totalScore - previous.totalScore;

  // Generate highlights
  const highlights: string[] = [];

  if (projects.length > 0) {
    highlights.push(`完成了 ${projects.length} 个项目`);
  }
  if (biggestGainValue > 0) {
    highlights.push(`${ABILITY_LABELS[biggestGainKey]}提升了 ${biggestGainValue} 分`);
  }
  if (growthRecords.length > 0) {
    highlights.push(`记录了 ${growthRecords.length} 条成长轨迹`);
  }
  if (totalScoreChange > 0) {
    highlights.push(`综合得分上涨 ${totalScoreChange} 分`);
  }

  // Generate summary text
  let summary = '';
  if (projects.length === 0 && growthRecords.length === 0) {
    summary = '这周还没有新记录。下周试着记录一个项目，让能力数据动起来。';
  } else if (projects.length > 0 && totalScoreChange > 0) {
    summary = `这周收获满满！你完成了 ${projects.length} 个项目，综合得分上涨了 ${totalScoreChange} 分。继续保持这个节奏。`;
  } else if (projects.length > 0) {
    summary = `这周你记录了 ${projects.length} 个项目，每一次投入都在积累能力值。`;
  } else {
    summary = `这周你记录了 ${growthRecords.length} 条成长轨迹，持续积累中。`;
  }

  return {
    weekStart: start,
    weekEnd: end,
    weekLabel: label,
    projects: {
      count: projects.length,
      items: projects,
    },
    growthRecords: {
      count: growthRecords.length,
      items: growthRecords,
    },
    abilityChanges: {
      current,
      previous,
      changes,
      biggestGain: {
        key: biggestGainKey,
        label: ABILITY_LABELS[biggestGainKey] || '',
        value: biggestGainValue,
      },
      totalScoreChange,
    },
    summary,
    highlights,
  };
}
