import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';
import { DEFAULT_ABILITY_SCORES } from '@/lib/ability-constants';
import { sendWelcomeEmail } from '@/services/email-service';

const phoneRegex = /^1[3-9]\d{9}$/;

const registerSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的11位手机号'),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string().min(6, '确认密码至少6位'),
  name: z.string().min(1, '请输入昵称').max(20, '昵称不超过20字'),
});

export async function POST(req: NextRequest) {
  const rateLimitResult = checkRateLimit(req, 'register', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: '注册请求过于频繁，请1小时后再试',
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: '注册请求过于频繁，请1小时后再试' },
      {
        status: 429,
        headers: { 'Retry-After': '3600' },
      }
    );
  }

  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        { error: '两次密码不一致' },
        { status: 400 }
      );
    }

    const existingByPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingByPhone) {
      return NextResponse.json(
        { error: '该手机号已注册' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const syntheticEmail = `${data.phone}@phone.local`;

    const user = await prisma.user.create({
      data: {
        name: sanitizeInput(data.name),
        email: syntheticEmail,
        phone: data.phone,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    await prisma.abilityScore.create({
      data: {
        userId: user.id,
        ...DEFAULT_ABILITY_SCORES,
      },
    });

    sendWelcomeEmail(user.email, user.name);

    return NextResponse.json(
      { message: '注册成功', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
