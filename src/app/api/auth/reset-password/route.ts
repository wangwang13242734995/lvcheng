import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const resetSchema = z.object({
  token: z.string().min(1, '无效的链接'),
  password: z.string().min(6, '密码至少6位'),
});

export async function POST(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'reset-password', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: '密码重置请求过于频繁，请1小时后再试',
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: '密码重置请求过于频繁，请1小时后再试' },
      {
        status: 429,
        headers: { 'Retry-After': '3600' },
      }
    );
  }

  try {
    const body = await req.json();
    const data = resetSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '链接无效或已过期' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: '密码重置成功' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '操作失败，请稍后重试' },
      { status: 500 }
    );
  }
}
