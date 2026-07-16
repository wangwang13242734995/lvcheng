import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  tech: z.string().optional(),
  difficulty: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'title_asc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'project-search', {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchSchema.parse(Object.fromEntries(searchParams));

    const where: any = { status: 'PUBLISHED' };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' as const } },
        { description: { contains: query.q, mode: 'insensitive' as const } },
        { outcome: { contains: query.q, mode: 'insensitive' as const } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.tech) {
      where.techStack = { contains: query.tech, mode: 'insensitive' as const };
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (query.sort === 'title_asc') orderBy = { title: 'asc' };
    else orderBy = { createdAt: 'desc' };

    const skip = (query.page - 1) * query.limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              major: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const enriched = projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      role: p.role,
      teamSize: p.teamSize,
      startDate: p.startDate,
      endDate: p.endDate,
      techStack: p.techStack ? JSON.parse(p.techStack) : [],
      description: p.description,
      difficulty: p.difficulty,
      outcome: p.outcome,
      outcomeType: p.outcomeType,
      outcomeData: p.outcomeData,
      createdAt: p.createdAt,
      user: p.user,
    }));

    return NextResponse.json({
      projects: enriched,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to search projects', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
