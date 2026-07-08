import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/challenges - 获取挑战列表
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'OPEN';

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const challenges = await prisma.challenge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          select: { id: true, userId: true },
        },
      },
    });

    // 获取当前用户是否已报名
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const enriched = challenges.map((c) => ({
      ...c,
      applicantCount: c.applications.length,
      hasApplied: userId ? c.applications.some((a) => a.userId === userId) : false,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Failed to fetch challenges:', error);
    return NextResponse.json({ error: '获取挑战列表失败' }, { status: 500 });
  }
}
