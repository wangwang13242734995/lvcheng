import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const rateLimitResult = checkRateLimit(req, 'weekly-report-detail', {
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
    const { id } = params;

    const report = await prisma.weeklyReport.findFirst({
      where: { id, userId },
    });

    if (!report) {
      return NextResponse.json({ error: '周报不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: report.id,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      recordCount: report.recordCount,
      hoursInvested: report.hoursInvested,
      abilityChanges: report.abilityChanges ? sanitizeInput(report.abilityChanges) : null,
      aiSuggestion: report.aiSuggestion ? sanitizeInput(report.aiSuggestion) : null,
      generatedAt: report.generatedAt,
    });
  } catch (error) {
    logger.error('Failed to fetch weekly report', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取周报详情失败' }, { status: 500 });
  }
}
