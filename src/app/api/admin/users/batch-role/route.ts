import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guards';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const batchRoleSchema = z.object({
  userIds: z.array(z.string()).min(1, '至少选择一个用户').max(100, '最多选择100个用户'),
  role: z.enum(['STUDENT', 'ENTERPRISE', 'ADMIN']),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const body = await req.json();
    const { userIds, role } = batchRoleSchema.parse(body);

    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        NOT: { id: guard.userId },
      },
      data: { role },
    });

    logger.info('Admin batch updated user roles', {
      adminId: guard.userId,
      targetCount: userIds.length,
      updatedCount: result.count,
      newRole: role,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      skipped: userIds.length - result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Failed to batch update user roles', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '批量更新失败' }, { status: 500 });
  }
}