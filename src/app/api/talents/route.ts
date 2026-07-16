import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { DEFAULT_ABILITY_SCORES } from '@/lib/ability-constants';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  q: z.string().optional(),
  major: z.string().optional(),
  skill: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  minCraft: z.coerce.number().int().min(0).max(100).optional(),
  minLearn: z.coerce.number().int().min(0).max(100).optional(),
  minDrive: z.coerce.number().int().min(0).max(100).optional(),
  minTeam: z.coerce.number().int().min(0).max(100).optional(),
  minGrit: z.coerce.number().int().min(0).max(100).optional(),
  minExpress: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(['score_desc', 'score_asc', 'projects_desc', 'newest']).default('score_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'talent-search', {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchSchema.parse(Object.fromEntries(searchParams));

    const where: any = {};

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { major: { contains: query.q, mode: 'insensitive' } },
        { skills: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.skill) {
      where.skills = { contains: query.skill, mode: 'insensitive' };
    }

    if (query.major) {
      where.major = { contains: query.major, mode: 'insensitive' };
    }

    const skip = (query.page - 1) * query.limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          abilityScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { projects: { where: { status: 'PUBLISHED' } } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    let talentList = users.map((user) => {
      const latestScore = user.abilityScores[0];
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        major: user.major,
        skills: user.skills ? JSON.parse(user.skills) : [],
        projectCount: user._count.projects,
        scores: latestScore
          ? {
              craft: latestScore.craft,
              learn: latestScore.learn,
              drive: latestScore.drive,
              team: latestScore.team,
              grit: latestScore.grit,
              express: latestScore.express,
              totalScore: latestScore.totalScore,
            }
          : DEFAULT_ABILITY_SCORES,
        createdAt: user.createdAt,
      };
    });

    if (query.minScore !== undefined) {
      talentList = talentList.filter((t) => t.scores.totalScore >= (query.minScore || 0));
    }

    if (query.minCraft !== undefined) {
      talentList = talentList.filter((t) => t.scores.craft >= (query.minCraft || 0));
    }
    if (query.minLearn !== undefined) {
      talentList = talentList.filter((t) => t.scores.learn >= (query.minLearn || 0));
    }
    if (query.minDrive !== undefined) {
      talentList = talentList.filter((t) => t.scores.drive >= (query.minDrive || 0));
    }
    if (query.minTeam !== undefined) {
      talentList = talentList.filter((t) => t.scores.team >= (query.minTeam || 0));
    }
    if (query.minGrit !== undefined) {
      talentList = talentList.filter((t) => t.scores.grit >= (query.minGrit || 0));
    }
    if (query.minExpress !== undefined) {
      talentList = talentList.filter((t) => t.scores.express >= (query.minExpress || 0));
    }

    switch (query.sort) {
      case 'score_desc':
        talentList.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
        break;
      case 'score_asc':
        talentList.sort((a, b) => a.scores.totalScore - b.scores.totalScore);
        break;
      case 'projects_desc':
        talentList.sort((a, b) => b.projectCount - a.projectCount);
        break;
      case 'newest':
        talentList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return NextResponse.json({
      users: talentList,
      total: totalCount,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalCount / query.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to search talents', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
