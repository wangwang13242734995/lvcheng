import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'user-achievements', {
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

    const [badges, certificates, stats] = await Promise.all([
      prisma.badge.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.certificate.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.badge.groupBy({
        by: ['level'],
        where: { userId: (session.user as any).id },
        _count: { level: true },
      }),
    ]);

    const sanitizedBadges = badges.map((b) => ({
      id: b.id,
      name: sanitizeInput(b.name),
      description: sanitizeInput(b.description),
      level: b.level,
      icon: b.icon,
      challengeId: b.challengeId,
      company: b.company ? sanitizeInput(b.company) : null,
      earnedAt: b.earnedAt,
    }));

    const sanitizedCertificates = certificates.map((c) => ({
      id: c.id,
      title: sanitizeInput(c.title),
      description: sanitizeInput(c.description),
      issuer: sanitizeInput(c.issuer),
      issuerLogo: c.issuerLogo,
      craftScore: c.craftScore,
      learnScore: c.learnScore,
      driveScore: c.driveScore,
      teamScore: c.teamScore,
      gritScore: c.gritScore,
      expressScore: c.expressScore,
      challengeId: c.challengeId,
      issuedAt: c.issuedAt,
    }));

    const levelStats: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      DIAMOND: 0,
    };
    stats.forEach((s) => {
      levelStats[s.level] = s._count.level;
    });

    return NextResponse.json({
      badges: sanitizedBadges,
      certificates: sanitizedCertificates,
      stats: {
        totalBadges: sanitizedBadges.length,
        totalCertificates: sanitizedCertificates.length,
        levelStats,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch user achievements', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取成就数据失败' }, { status: 500 });
  }
}
