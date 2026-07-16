import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/user/delete - 删除用户账号及所有关联数据（GDPR合规）
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await req.json().catch(() => ({}));
    if (body.confirm !== 'DELETE') {
      return NextResponse.json(
        { error: '请确认删除操作（confirm: "DELETE"）' },
        { status: 400 }
      );
    }

    // 级联删除所有关联数据
    await prisma.$transaction([
      prisma.growthRecord.deleteMany({ where: { userId } }),
      prisma.abilityScore.deleteMany({ where: { userId } }),
      prisma.weeklyReport.deleteMany({ where: { userId } }),
      prisma.timeCapsule.deleteMany({ where: { userId } }),
      prisma.badge.deleteMany({ where: { userId } }),
      prisma.certificate.deleteMany({ where: { userId } }),
      prisma.challengeSubmission.deleteMany({ where: { userId } }),
      prisma.challengeApplication.deleteMany({ where: { userId } }),
      prisma.project.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    logger.info('User account deleted', { userId });

    return NextResponse.json({ success: true, message: '账号已删除' });
  } catch (error) {
    logger.error('Failed to delete user account', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '删除账号失败' }, { status: 500 });
  }
}
