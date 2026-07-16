import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';
import { createNewSubmissionNotification } from '@/services/notification-service';

const submissionSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字'),
  description: z.string().min(1, '描述不能为空').max(5000, '描述不能超过5000字'),
  solutionUrl: z.string().url('请输入有效的链接').optional().or(z.literal('')),
  attachments: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResult = checkRateLimit(req, 'challenge-submit', {
    windowMs: 60 * 1000,
    maxRequests: 10,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: '提交过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const data = submissionSchema.parse(body);

    const application = await prisma.challengeApplication.findFirst({
      where: { challengeId: params.id, userId, status: 'PENDING' },
      include: { challenge: { select: { title: true, creatorId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: '你还没有报名这个挑战' }, { status: 400 });
    }

    const cleanTitle = sanitizeInput(data.title);
    const cleanDescription = sanitizeInput(data.description);
    const cleanSolutionUrl = data.solutionUrl ? data.solutionUrl : null;

    const existingSubmission = await prisma.challengeSubmission.findFirst({
      where: { challengeId: params.id, userId },
    });

    if (existingSubmission) {
      const updated = await prisma.challengeSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          title: cleanTitle,
          description: cleanDescription,
          solutionUrl: cleanSolutionUrl,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
          status: 'PENDING',
        },
      });
      return NextResponse.json({ success: true, submission: updated });
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: params.id,
        userId,
        applicationId: application.id,
        title: cleanTitle,
        description: cleanDescription,
        solutionUrl: cleanSolutionUrl,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      },
    });

    await prisma.challengeApplication.update({
      where: { id: application.id },
      data: { status: 'ACCEPTED' },
    });

    // 通知企业用户
    if (application.challenge.creatorId) {
      const submitter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await createNewSubmissionNotification(
        application.challenge.creatorId,
        submitter?.name || '一位用户',
        application.challenge.title,
        params.id
      );
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Failed to submit challenge', { id: params.id, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const submission = await prisma.challengeSubmission.findFirst({
      where: { challengeId: params.id, userId },
    });

    return NextResponse.json(submission || null);
  } catch (error) {
    logger.error('Failed to fetch submission', { id: params.id, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '获取提交失败' }, { status: 500 });
  }
}
