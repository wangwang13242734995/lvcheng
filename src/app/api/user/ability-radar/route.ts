import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLatestAbilityScore, getAbilityHistory } from '@/services/ability-engine';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-ability-radar', {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [latestScore, history, completedChallenges] = await Promise.all([
      getLatestAbilityScore(userId),
      getAbilityHistory(userId, 90),
      prisma.challengeSubmission.count({
        where: { userId, status: 'ACCEPTED' },
      }),
    ]);

    const dimensions = [
      { key: 'craft', label: '专业力', icon: '🛠', description: '基于项目数量、技术栈广度、成果量化' },
      { key: 'learn', label: '学习力', icon: '📚', description: '基于跨领域项目、新技能采纳' },
      { key: 'drive', label: '自驱力', icon: '⚡', description: '基于个人项目、持续记录天数' },
      { key: 'team', label: '协作力', icon: '🤝', description: '基于团队项目、角色多样性' },
      { key: 'grit', label: '抗压力', icon: '🏔', description: '基于困难解决记录、完成率' },
      { key: 'express', label: '表达力', icon: '🎯', description: '基于描述结构化、视频展示' },
    ];

    const currentValues = latestScore
      ? {
          craft: latestScore.craft,
          learn: latestScore.learn,
          drive: latestScore.drive,
          team: latestScore.team,
          grit: latestScore.grit,
          express: latestScore.express,
        }
      : { craft: 0, learn: 0, drive: 0, team: 0, grit: 0, express: 0 };

    const radarData = dimensions.map((d) => ({
      subject: d.label,
      value: currentValues[d.key as keyof typeof currentValues] || 0,
      fullMark: 100,
    }));

    const trendData = history.map((h) => ({
      date: h.calculatedAt,
      craft: h.craft,
      learn: h.learn,
      drive: h.drive,
      team: h.team,
      grit: h.grit,
      express: h.express,
      total: h.totalScore,
    }));

    const sortedDims = [...dimensions].sort(
      (a, b) =>
        (currentValues[b.key as keyof typeof currentValues] || 0) -
        (currentValues[a.key as keyof typeof currentValues] || 0)
    );

    const suggestions = sortedDims
      .slice(-3)
      .map((d) => ({
        dimension: d.label,
        icon: d.icon,
        currentValue: currentValues[d.key as keyof typeof currentValues] || 0,
        description: d.description,
      }));

    return NextResponse.json({
      radar: radarData,
      trend: trendData,
      latest: latestScore,
      dimensions,
      completedChallenges,
      suggestions,
    });
  } catch (error) {
    logger.error('Failed to fetch ability radar', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取能力数据失败' }, { status: 500 });
  }
}
