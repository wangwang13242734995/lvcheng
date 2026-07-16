import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guards';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const roleUpdateSchema = z.object({
  role: z.enum(['STUDENT', 'ENTERPRISE', 'ADMIN']),
});

// GET /api/admin/users - 获取用户列表（管理员）
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { projects: true, abilityScores: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('Failed to fetch admin users', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id]/role - 更新用户角色（管理员）
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.isAdmin) return guard.response;

  try {
    const body = await req.json();
    const { role } = roleUpdateSchema.parse(body);

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    if (userId === guard.userId) {
      return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    logger.info('Admin updated user role', {
      adminId: guard.userId,
      targetUserId: userId,
      newRole: role,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Failed to update user role', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '更新用户角色失败' }, { status: 500 });
  }
}
