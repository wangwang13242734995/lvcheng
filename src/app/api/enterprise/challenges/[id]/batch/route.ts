import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createSubmissionReviewedNotification } from '@/services/notification-service';
import { handleSubmissionApproval } from '@/services/approval-reward';

export async function POST(
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

    const body = await req.json();
    const { targetIds, action, targetType } = body;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json({ error: '请选择记录' }, { status: 400 });
    }

    let result;

    if (targetType === 'applications') {
      switch (action) {
        case 'APPROVE':
          result = await prisma.challengeApplication.updateMany({
            where: { id: { in: targetIds }, challengeId, status: 'PENDING' },
            data: { status: 'ACCEPTED' },
          });
          break;
        case 'REJECT':
          result = await prisma.challengeApplication.updateMany({
            where: { id: { in: targetIds }, challengeId, status: 'PENDING' },
            data: { status: 'REJECTED' },
          });
          break;
        default:
          return NextResponse.json({ error: '未知操作' }, { status: 400 });
      }
      logger.info('批量操作报名', { action, count: result.count, challengeId });
    } else if (targetType === 'submissions') {
      switch (action) {
        case 'APPROVE':
          for (const submissionId of targetIds) {
            const submission = await prisma.challengeSubmission.findUnique({
              where: { id: submissionId },
              select: { userId: true, status: true },
            });
            if (submission && submission.status === 'PENDING') {
              await prisma.challengeSubmission.update({
                where: { id: submissionId },
                data: { status: 'ACCEPTED' },
              });
              await createSubmissionReviewedNotification(
                submission.userId,
                challenge.title,
                challengeId,
                'ACCEPTED'
              );
              await handleSubmissionApproval({
                userId: submission.userId,
                submissionId,
                challengeId,
                reviewerId: (session.user as any).id,
              });
            }
          }
          result = { count: targetIds.length };
          break;
        case 'REJECT':
          for (const submissionId of targetIds) {
            const submission = await prisma.challengeSubmission.findUnique({
              where: { id: submissionId },
              select: { userId: true, status: true },
            });
            if (submission && submission.status === 'PENDING') {
              await prisma.challengeSubmission.update({
                where: { id: submissionId },
                data: { status: 'REJECTED' },
              });
              await createSubmissionReviewedNotification(
                submission.userId,
                challenge.title,
                challengeId,
                'REJECTED'
              );
            }
          }
          result = { count: targetIds.length };
          break;
        default:
          return NextResponse.json({ error: '未知操作' }, { status: 400 });
      }
      logger.info('批量操作提交', { action, count: result.count, challengeId });
    } else {
      return NextResponse.json({ error: '请指定目标类型' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} 条记录已更新`,
      updatedCount: result.count,
    });
  } catch (error) {
    logger.error('批量操作失败', {
      challengeId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}