import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    const { name, school, major, graduationYear, bio, skills } = body;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name,
        school,
        major,
        graduationYear,
        bio,
        skills,
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
  } catch {
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
  }
}
