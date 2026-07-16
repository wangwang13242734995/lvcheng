import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userName = (session.user as any).name;
    const challengeId = params.id;

    if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, title: true, company: true },
    });

    if (!challenge) {
      return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
    }

    if (role === 'ENTERPRISE' && challenge.company !== userName) {
      return NextResponse.json({ error: '无权限管理此挑战' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'applications') {
      const applications = await prisma.challengeApplication.findMany({
        where: { challengeId },
        orderBy: { appliedAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              major: true,
            },
          },
        },
      });

      const headers = ['序号', '姓名', '邮箱', '专业', '状态', '报名时间'];
      const rows = applications.map((a, i) => [
        escapeCsv(i + 1),
        escapeCsv(a.user.name),
        escapeCsv(a.user.email),
        escapeCsv(a.user.major),
        escapeCsv(a.status),
        escapeCsv(a.appliedAt.toISOString()),
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${challenge.title}_报名数据_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (type === 'submissions') {
      const submissions = await prisma.challengeSubmission.findMany({
        where: { challengeId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              major: true,
            },
          },
        },
      });

      const headers = ['序号', '姓名', '邮箱', '专业', '作品标题', '状态', '评审意见', '提交时间'];
      const rows = submissions.map((s, i) => [
        escapeCsv(i + 1),
        escapeCsv(s.user.name),
        escapeCsv(s.user.email),
        escapeCsv(s.user.major),
        escapeCsv(s.title),
        escapeCsv(s.status),
        escapeCsv(s.reviewComment),
        escapeCsv(s.createdAt.toISOString()),
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${challenge.title}_提交数据_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: '请指定导出类型 (type=applications 或 type=submissions)' }, { status: 400 });
  } catch (error) {
    logger.error('Failed to export enterprise data', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}