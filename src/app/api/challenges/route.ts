import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().min(1, '请输入挑战标题').max(200, '标题不能超过200字'),
  description: z.string().min(10, '描述至少10个字').max(10000, '描述不能超过10000字'),
  category: z.enum(['TECH', 'PRODUCT', 'GROWTH', 'MARKETING']).default('TECH'),
  requiredCraft: z.coerce.number().int().min(0).max(100).default(0),
  requiredLearn: z.coerce.number().int().min(0).max(100).default(0),
  requiredDrive: z.coerce.number().int().min(0).max(100).default(0),
  requiredTeam: z.coerce.number().int().min(0).max(100).default(0),
  requiredGrit: z.coerce.number().int().min(0).max(100).default(0),
  requiredExpress: z.coerce.number().int().min(0).max(100).default(0),
  reward: z.string().optional(),
  rewardAmount: z.coerce.number().int().min(0).default(0),
  rewardType: z.enum(['CERTIFICATE', 'CASH', 'PRIZE', 'INTERNSHIP']).default('CERTIFICATE'),
  deadline: z.string().optional(),
  spots: z.coerce.number().int().min(1).optional(),
  company: z.string().min(1, '请输入企业名称').max(100, '企业名称不能超过100字'),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'OPEN';
    const q = searchParams.get('q');
    const rewardType = searchParams.get('rewardType');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);

    const minReward = parseInt(searchParams.get('minReward') || '0');
    const maxReward = parseInt(searchParams.get('maxReward') || '0');
    const minCraft = parseInt(searchParams.get('minCraft') || '0');
    const minLearn = parseInt(searchParams.get('minLearn') || '0');
    const minDrive = parseInt(searchParams.get('minDrive') || '0');
    const minTeam = parseInt(searchParams.get('minTeam') || '0');
    const minGrit = parseInt(searchParams.get('minGrit') || '0');
    const minExpress = parseInt(searchParams.get('minExpress') || '0');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (rewardType) {
      where.rewardType = rewardType;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' as const } },
        { company: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    if (minReward > 0) {
      where.rewardAmount = { ...(where.rewardAmount || {}), gte: minReward };
    }
    if (maxReward > 0) {
      where.rewardAmount = { ...(where.rewardAmount || {}), lte: maxReward };
    }
    if (minCraft > 0) {
      where.requiredCraft = { gte: minCraft };
    }
    if (minLearn > 0) {
      where.requiredLearn = { gte: minLearn };
    }
    if (minDrive > 0) {
      where.requiredDrive = { gte: minDrive };
    }
    if (minTeam > 0) {
      where.requiredTeam = { gte: minTeam };
    }
    if (minGrit > 0) {
      where.requiredGrit = { gte: minGrit };
    }
    if (minExpress > 0) {
      where.requiredExpress = { gte: minExpress };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'reward_desc') orderBy = { rewardAmount: 'desc' };
    else if (sort === 'deadline_asc') orderBy = { deadline: 'asc' };
    else if (sort === 'applicants_desc') orderBy = { applications: { _count: 'desc' } };
    else orderBy = { createdAt: 'desc' };

    const skip = (page - 1) * pageSize;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const [challenges, total, favorites] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          applications: {
            select: { id: true, userId: true },
          },
        },
      }),
      prisma.challenge.count({ where }),
      userId ? prisma.challengeFavorite.findMany({
        where: { userId },
        select: { challengeId: true },
      }) : [],
    ]);

    const favoriteIds = favorites.map(f => f.challengeId);

    const enriched = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      company: c.company,
      requiredCraft: c.requiredCraft,
      requiredLearn: c.requiredLearn,
      requiredDrive: c.requiredDrive,
      requiredTeam: c.requiredTeam,
      requiredGrit: c.requiredGrit,
      requiredExpress: c.requiredExpress,
      reward: c.reward,
      rewardAmount: c.rewardAmount,
      rewardType: c.rewardType,
      deadline: c.deadline,
      spots: c.spots,
      status: c.status,
      createdAt: c.createdAt,
      applicantCount: c.applications.length,
      hasApplied: userId ? c.applications.some((a) => a.userId === userId) : false,
      isFavorited: favoriteIds.includes(c.id),
    }));

    return NextResponse.json({
      challenges: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('Failed to fetch challenges', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '获取挑战列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'create-challenge', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '发布过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '只有企业用户可以发布挑战' }, { status: 403 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const cleanTitle = sanitizeInput(data.title);
    const cleanDescription = sanitizeInput(data.description);
    const cleanCompany = sanitizeInput(data.company);
    const cleanReward = data.reward ? sanitizeInput(data.reward) : null;

    const challenge = await prisma.challenge.create({
      data: {
        title: cleanTitle,
        description: cleanDescription,
        category: data.category,
        company: cleanCompany,
        requiredCraft: data.requiredCraft,
        requiredLearn: data.requiredLearn,
        requiredDrive: data.requiredDrive,
        requiredTeam: data.requiredTeam,
        requiredGrit: data.requiredGrit,
        requiredExpress: data.requiredExpress,
        reward: cleanReward,
        rewardAmount: data.rewardAmount,
        rewardType: data.rewardType,
        deadline: data.deadline ? new Date(data.deadline) : null,
        spots: data.spots,
        status: 'OPEN',
        creatorId: (session.user as any).id,
      },
    });

    logger.info('Challenge created', {
      challengeId: challenge.id,
      userId: (session.user as any).id,
      role,
      company: cleanCompany,
    });

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Failed to create challenge', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '发布挑战失败' }, { status: 500 });
  }
}
