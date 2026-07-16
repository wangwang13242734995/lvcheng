import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'weekly-reports-get', {
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

    const reports = await prisma.weeklyReport.findMany({
      where: { userId },
      orderBy: { weekEnd: 'desc' },
      take: 20,
    });

    const sanitized = reports.map((r) => ({
      id: r.id,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      recordCount: r.recordCount,
      hoursInvested: r.hoursInvested,
      abilityChanges: r.abilityChanges ? sanitizeInput(r.abilityChanges) : null,
      aiSuggestion: r.aiSuggestion ? sanitizeInput(r.aiSuggestion) : null,
      generatedAt: r.generatedAt,
    }));

    return NextResponse.json({ reports: sanitized });
  } catch (error) {
    logger.error('Failed to fetch weekly reports', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取周报失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'weekly-reports-post', {
    windowMs: 60 * 1000,
    maxRequests: 10,
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

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const existing = await prisma.weeklyReport.findFirst({
      where: {
        userId,
        weekStart: { gte: weekStart },
        weekEnd: { lte: weekEnd },
      },
    });

    if (existing) {
      return NextResponse.json({ error: '本周周报已生成，请勿重复生成' }, { status: 409 });
    }

    const [growthRecords, abilityScores, projects, submissions] = await Promise.all([
      prisma.growthRecord.findMany({
        where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.abilityScore.findMany({
        where: { userId, calculatedAt: { gte: weekStart, lte: weekEnd } },
        orderBy: { calculatedAt: 'desc' },
        take: 2,
      }),
      prisma.project.findMany({
        where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.challengeSubmission.findMany({
        where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

    const recordCount = growthRecords.length + projects.length + submissions.length;
    const hoursInvested = Math.round(recordCount * 0.5 * 10) / 10;

    const abilityChanges: Record<string, number> = {};
    if (abilityScores.length >= 2) {
      const latest = abilityScores[0];
      const prev = abilityScores[1];
      const dims = ['craft', 'learn', 'drive', 'team', 'grit', 'express'] as const;
      dims.forEach((dim) => {
        const diff = (latest as any)[dim] - (prev as any)[dim];
        if (Math.abs(diff) >= 1) {
          abilityChanges[dim] = Math.round(diff);
        }
      });
    }

    const suggestions: string[] = [];
    if (recordCount === 0) {
      suggestions.push('本周暂无记录，建议开始记录你的成长点滴，积少成多。');
    } else {
      if (growthRecords.length === 0) {
        suggestions.push('本周未记录成长，建议每天花5分钟记录学习或工作收获。');
      }
      if (projects.length === 0) {
        suggestions.push('本周未添加项目，可以尝试将近期参与的项目补充进来。');
      }
      if (Object.keys(abilityChanges).length === 0) {
        suggestions.push('能力分暂无变化，建议通过参与更多挑战来提升能力。');
      } else {
        const improved = Object.entries(abilityChanges).filter(([, v]) => v > 0);
        if (improved.length > 0) {
          suggestions.push(`恭喜！${improved.map(([k]) => k).join('、')} 能力有所提升，继续保持！`);
        }
      }
    }

    const report = await prisma.weeklyReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        recordCount,
        hoursInvested: Math.round(hoursInvested * 10) / 10,
        abilityChanges: Object.keys(abilityChanges).length > 0 ? JSON.stringify(abilityChanges) : null,
        aiSuggestion: suggestions.join(' '),
      },
    });

    logger.info('Weekly report generated', { userId, reportId: report.id, recordCount });

    return NextResponse.json({
      id: report.id,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      recordCount: report.recordCount,
      hoursInvested: report.hoursInvested,
      abilityChanges: report.abilityChanges,
      aiSuggestion: report.aiSuggestion,
      generatedAt: report.generatedAt,
    });
  } catch (error) {
    logger.error('Failed to generate weekly report', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '生成周报失败' }, { status: 500 });
  }
}
