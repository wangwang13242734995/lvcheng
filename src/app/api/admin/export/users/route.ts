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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        major: true,
        graduationYear: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            challengeApplications: true,
            challengeSubmissions: true,
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID', '姓名', '邮箱', '角色', '专业', '毕业年份',
      '项目数', '报名数', '提交数', '通知数', '注册时间',
    ];

    const rows = users.map((u) => [
      escapeCsv(u.id),
      escapeCsv(u.name),
      escapeCsv(u.email),
      escapeCsv(u.role),
      escapeCsv(u.major),
      escapeCsv(u.graduationYear),
      escapeCsv(u._count.projects),
      escapeCsv(u._count.challengeApplications),
      escapeCsv(u._count.challengeSubmissions),
      escapeCsv(u._count.notifications),
      escapeCsv(u.createdAt.toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export users', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
