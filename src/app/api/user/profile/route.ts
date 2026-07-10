import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const profileSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  school: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.number().int().min(1900).max(2099).optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        school: true,
        major: true,
        graduationYear: true,
        bio: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const data = profileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name: sanitizeInput(data.name),
        school: data.school ? sanitizeInput(data.school) : null,
        major: data.major ? sanitizeInput(data.major) : null,
        graduationYear: data.graduationYear,
        bio: data.bio ? sanitizeInput(data.bio) : null,
        skills: data.skills ? sanitizeInput(data.skills) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        school: true,
        major: true,
        graduationYear: true,
        bio: true,
        skills: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
  }
}
