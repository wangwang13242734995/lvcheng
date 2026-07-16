import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/services/email-service';

const forgotSchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
});

export async function POST(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'forgot-password', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
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
    const data = forgotSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: '如果该邮箱已注册，重置链接已发送' },
        { status: 200 }
      );
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendPasswordResetEmail(data.email, resetToken);

    return NextResponse.json({
      message: '如果该邮箱已注册，重置链接已发送',
    }, { status: 200 });
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
