import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sanitizeInput, validateUrlOrNull } from '@/lib/sanitize';

const updateSchema = z.object({
  title: z.string().min(1, '请输入项目名称'),
  type: z.enum(['COURSE', 'COMPETITION', 'INTERNSHIP', 'PERSONAL', 'CHALLENGE']),
  role: z.string().optional(),
  teamSize: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  outcome: z.string().optional(),
  outcomeType: z.enum(['QUANTIFIED', 'AWARD', 'LAUNCHED', 'OPEN_SOURCE']).optional(),
  outcomeData: z.string().optional(),
  difficultyEncountered: z.string().max(200).optional(),
  solution: z.string().max(200).optional(),
  links: z.array(z.object({ type: z.string(), url: z.string().url('请输入有效的链接') })).optional(),
  videoUrl: z.string().url('请输入有效的视频链接').optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user ? (session.user as any).id : null;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      growthRecords: true,
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  const isOwner = currentUserId === project.userId;
  if (project.status !== 'PUBLISHED' && !isOwner) {
    return NextResponse.json({ error: '无权查看此项目' }, { status: 403 });
  }

  return NextResponse.json({ ...project, isOwner });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: '无权修改此项目' }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        title: sanitizeInput(data.title),
        type: data.type,
        role: data.role ? sanitizeInput(data.role) : undefined,
        teamSize: data.teamSize,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        techStack: data.techStack ? JSON.stringify(data.techStack) : null,
        description: data.description ? sanitizeInput(data.description) : undefined,
        difficulty: data.difficulty ? sanitizeInput(data.difficulty) : undefined,
        outcome: data.outcome ? sanitizeInput(data.outcome) : undefined,
        outcomeType: data.outcomeType,
        outcomeData: data.outcomeData ? sanitizeInput(data.outcomeData) : undefined,
        difficultyEncountered: data.difficultyEncountered ? sanitizeInput(data.difficultyEncountered) : undefined,
        solution: data.solution ? sanitizeInput(data.solution) : undefined,
        links: data.links ? JSON.stringify(data.links) : null,
        videoUrl: data.videoUrl || null,
        status: data.status || project.status,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: '无权删除此项目' }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: '项目已删除' });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
