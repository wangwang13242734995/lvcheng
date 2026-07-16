import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';
import { handleSubmissionApproval } from '@/services/approval-reward';
import { createSubmissionReviewedNotification } from '@/services/notification-service';
import { sendSubmissionResultEmail } from '@/services/email-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
  reviewComment: z.string().max(1000, '评语不能超过1000字').optional(),
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

// GET /api/enterprise/challenges/[id]/submissions - 获取提交列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-submissions-get', {
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

    const submissions = await prisma.challengeSubmission.findMany({
      where: { challengeId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            major: true,
            avatar: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
      },
    });

    const list = submissions.map((sub) => ({
      id: sub.id,
      title: sanitizeInput(sub.title),
      description: sanitizeInput(sub.description),
      solutionUrl: sub.solutionUrl,
      attachments: sub.attachments,
      status: sub.status,
      reviewComment: sub.reviewComment ? sanitizeInput(sub.reviewComment) : null,
      reviewedBy: sub.reviewedBy,
      reviewedAt: sub.reviewedAt,
      abilityGrowth: sub.abilityGrowth,
      createdAt: sub.createdAt,
      user: {
        id: sub.user.id,
        name: sanitizeInput(sub.user.name),
        email: sanitizeInput(sub.user.email),
        major: sub.user.major ? sanitizeInput(sub.user.major) : null,
        avatar: sub.user.avatar,
      },
      application: sub.application
        ? {
            id: sub.application.id,
            status: sub.application.status,
            appliedAt: sub.application.appliedAt,
          }
        : null,
    }));

    return NextResponse.json({ submissions: list });
  } catch (error) {
    logger.error('Failed to fetch enterprise submissions', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '获取提交失败' }, { status: 500 });
  }
}

// PATCH /api/enterprise/challenges/[id]/submissions?submissionId=xxx - 审核提交
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'enterprise-submissions-patch', {
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
    const submissionId = searchParams.get('submissionId');
    if (!submissionId) {
      return NextResponse.json({ error: '缺少提交ID' }, { status: 400 });
    }

    const body = await req.json();
    const data = reviewSchema.parse(body);

    const submission = await prisma.challengeSubmission.findFirst({
      where: { id: submissionId, challengeId: params.id },
      select: { id: true, status: true, userId: true },
    });

    if (!submission) {
      return NextResponse.json({ error: '提交记录不存在' }, { status: 404 });
    }

    const operatorId = (session.user as any).id;
    const updated = await prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: {
        status: data.status,
        reviewComment: data.reviewComment ? sanitizeInput(data.reviewComment) : null,
        reviewedBy: operatorId,
        reviewedAt: new Date(),
      },
    });

    if (data.status === 'ACCEPTED' && submission.status !== 'ACCEPTED') {
      const approvalResult = await handleSubmissionApproval({
        submissionId,
        challengeId: params.id,
        userId: submission.userId,
        reviewerId: operatorId,
      });

      const challenge = access.challenge!;
      await createSubmissionReviewedNotification(
        submission.userId,
        challenge.title,
        challenge.id,
        data.status,
        data.reviewComment
      );

      const submitter = await prisma.user.findUnique({
        where: { id: submission.userId },
        select: { email: true, name: true },
      });
      if (submitter) {
        sendSubmissionResultEmail(
          submitter.email,
          submitter.name,
          challenge.title,
          data.status,
          data.reviewComment
        );
      }

      logger.info('Submission reviewed', {
        challengeId: params.id,
        submissionId,
        status: data.status,
        operator: operatorId,
      });

      return NextResponse.json({
        success: true,
        submission: updated,
        rewards: approvalResult.rewards || null,
      });
    }

    const challengeForNotify = access.challenge!;
    await createSubmissionReviewedNotification(
      submission.userId,
      challengeForNotify.title,
      challengeForNotify.id,
      data.status,
      data.reviewComment
    );

    const submitterForEmail = await prisma.user.findUnique({
      where: { id: submission.userId },
      select: { email: true, name: true },
    });
    if (submitterForEmail) {
      sendSubmissionResultEmail(
        submitterForEmail.email,
        submitterForEmail.name,
        challengeForNotify.title,
        data.status,
        data.reviewComment
      );
    }

    logger.info('Submission reviewed', {
      challengeId: params.id,
      submissionId,
      status: data.status,
      operator: operatorId,
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || '参数错误' }, { status: 400 });
    }
    logger.error('Failed to review submission', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
