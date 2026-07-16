import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guards';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const challenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        company: true,
        category: true,
        status: true,
        rewardAmount: true,
        rewardType: true,
        deadline: true,
        spots: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID', '标题', '企业', '分类', '状态', '奖金(元)', '奖励类型',
      '名额', '报名数', '提交数', '截止时间', '创建时间',
    ];

    const rows = challenges.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.title),
      escapeCsv(c.company),
      escapeCsv(c.category),
      escapeCsv(c.status),
      escapeCsv(c.rewardAmount > 0 ? (c.rewardAmount / 100).toFixed(2) : '0'),
      escapeCsv(c.rewardType),
      escapeCsv(c.spots),
      escapeCsv(c._count.applications),
      escapeCsv(c._count.submissions),
      escapeCsv(c.deadline ? c.deadline.toISOString() : ''),
      escapeCsv(c.createdAt.toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="challenges_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export challenges', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
