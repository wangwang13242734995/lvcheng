import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6位'),
  role: z.enum(['STUDENT', 'ENTERPRISE', 'ADMIN']).default('STUDENT'),
  school: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        school: data.school,
        major: data.major,
        graduationYear: data.graduationYear,
      },
    });

    // Create initial ability score
    await prisma.abilityScore.create({
      data: {
        userId: user.id,
        craft: 30,
        learn: 30,
        drive: 30,
        team: 30,
        grit: 30,
        express: 30,
        totalScore: 30,
      },
    });

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
