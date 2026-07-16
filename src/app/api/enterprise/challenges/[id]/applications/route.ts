import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';
import { z } from 'zod';
import {
  createApplicationApprovedNotification,
  createApplicationRejectedNotification,
} from '@/services/notification-service';

export const dynamic = 'force-dynamic';

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
});

async function checkEnterpriseAccess(session: any, challengeId: string) {
  const role = (session.user as any).role;
  const userName = (session.user as any).name;

  if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
    return { allowed: false, status: 403, message: '无权限访问' };
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, company: true, title: true },
  });

  if (!challenge) {
    return { allowed: false, status: 404, message: '挑战不存在' };
  }

  if (role === 'ENTERPRISE' && challenge.company !== userName) {
    return { allowed: false, status: 403, message: '无权限管理此挑战' };
  }

  return { allowed: true, challenge };
}

// GET /api/enterprise/challenges/[id]/applications - 获取报名者列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-applications-get', {
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

    const access = await checkEnterpriseAccess(session, params.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const applications = await prisma.challengeApplication.findMany({
      where: { challengeId: params.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            major: true,
            avatar: true,
            bio: true,
            skills: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    const list = applications.map((app) => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      user: {
        id: app.user.id,
        name: sanitizeInput(app.user.name),
        email: sanitizeInput(app.user.email),
        major: app.user.major ? sanitizeInput(app.user.major) : null,
        avatar: app.user.avatar,
        bio: app.user.bio ? sanitizeInput(app.user.bio) : null,
        skills: app.user.skills ? sanitizeInput(app.user.skills) : null,
      },
      submission: app.submission
        ? {
            id: app.submission.id,
            status: app.submission.status,
            title: sanitizeInput(app.submission.title),
            createdAt: app.submission.createdAt,
          }
        : null,
    }));

    return NextResponse.json({ applications: list });
  } catch (error) {
    logger.error('Failed to fetch enterprise applications', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取报名者失败' }, { status: 500 });
  }
}

// PATCH /api/enterprise/challenges/[id]/applications/[applicationId] - 审核报名
// 这里我们使用查询参数 applicationId
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-applications-patch', {
    windowMs: 60 * 1000,
    maxRequests: 30,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const access = await checkEnterpriseAccess(session, params.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json({ error: '缺少报名ID' }, { status: 400 });
    }

    const body = await req.json();
    const data = statusUpdateSchema.parse(body);

    const application = await prisma.challengeApplication.findFirst({
      where: { id: applicationId, challengeId: params.id },
    });

    if (!application) {
      return NextResponse.json({ error: '报名记录不存在' }, { status: 404 });
    }

    const updated = await prisma.challengeApplication.update({
      where: { id: applicationId },
      data: { status: data.status },
    });

    // 发送通知给用户
    const challenge = access.challenge!;
    if (data.status === 'ACCEPTED') {
      await createApplicationApprovedNotification(
        application.userId,
        challenge.title,
        challenge.id
      );
    } else if (data.status === 'REJECTED') {
      await createApplicationRejectedNotification(
        application.userId,
        challenge.title
      );
    }

    logger.info('Application status updated', {
      challengeId: params.id,
      applicationId,
      status: data.status,
      operator: (session.user as any).id,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to update application status', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
