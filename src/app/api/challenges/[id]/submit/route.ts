import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, description, solutionUrl, attachments } = body;

    if (!title || !description) {
      return NextResponse.json({ error: '标题和描述不能为空' }, { status: 400 });
    }

    const application = await prisma.challengeApplication.findFirst({
      where: { challengeId: params.id, userId, status: 'PENDING' },
    });

    if (!application) {
      return NextResponse.json({ error: '你还没有报名这个挑战' }, { status: 400 });
    }

    const existingSubmission = await prisma.challengeSubmission.findFirst({
      where: { challengeId: params.id, userId },
    });

    if (existingSubmission) {
      const updated = await prisma.challengeSubmission.update({
        where: { id: existingSubmission.id },
        data: { title, description, solutionUrl, attachments, status: 'PENDING' },
      });
      return NextResponse.json({ success: true, submission: updated });
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: params.id,
        userId,
        applicationId: application.id,
        title,
        description,
        solutionUrl,
        attachments,
      },
    });

    await prisma.challengeApplication.update({
      where: { id: application.id },
      data: { status: 'ACCEPTED' },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Failed to submit challenge:', error);
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
    console.error('Failed to fetch submission:', error);
    return NextResponse.json({ error: '获取提交失败' }, { status: 500 });
  }
}