import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/challenges/[id]/apply - 报名挑战
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

    // 检查挑战是否存在
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: { applications: true },
    });

    if (!challenge) {
      return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
    }

    if (challenge.status !== 'OPEN') {
      return NextResponse.json({ error: '该挑战已关闭' }, { status: 400 });
    }

    // 检查名额
    if (challenge.spots && challenge.applications.length >= challenge.spots) {
      return NextResponse.json({ error: '名额已满' }, { status: 400 });
    }

    // 检查是否已报名
    const existing = challenge.applications.find((a) => a.userId === userId);
    if (existing) {
      return NextResponse.json({ error: '你已经报名了' }, { status: 400 });
    }

    // 报名
    const application = await prisma.challengeApplication.create({
      data: {
        challengeId: params.id,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      application,
      message: '报名成功！',
    });
  } catch (error) {
    console.error('Failed to apply for challenge:', error);
    return NextResponse.json({ error: '报名失败' }, { status: 500 });
  }
}

// DELETE /api/challenges/[id]/apply - 取消报名
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const application = await prisma.challengeApplication.findFirst({
      where: { challengeId: params.id, userId },
    });

    if (!application) {
      return NextResponse.json({ error: '你还没有报名' }, { status: 400 });
    }

    await prisma.challengeApplication.delete({
      where: { id: application.id },
    });

    return NextResponse.json({ success: true, message: '已取消报名' });
  } catch (error) {
    console.error('Failed to cancel application:', error);
    return NextResponse.json({ error: '取消报名失败' }, { status: 500 });
  }
}
