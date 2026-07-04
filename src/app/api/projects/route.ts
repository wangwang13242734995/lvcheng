import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateAbilityScores } from '@/services/ability-engine';

const projectSchema = z.object({
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
  links: z.array(z.object({ type: z.string(), url: z.string() })).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = projectSchema.parse(body);
    const userId = (session.user as any).id;

    const project = await prisma.project.create({
      data: {
        userId,
        title: data.title,
        type: data.type,
        role: data.role,
        teamSize: data.teamSize,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        techStack: data.techStack ? JSON.stringify(data.techStack) : null,
        description: data.description,
        difficulty: data.difficulty,
        outcome: data.outcome,
        outcomeType: data.outcomeType,
        outcomeData: data.outcomeData,
        difficultyEncountered: data.difficultyEncountered,
        solution: data.solution,
        links: data.links ? JSON.stringify(data.links) : null,
        status: data.status,
      },
    });

    // Create growth record for the project
    await prisma.growthRecord.create({
      data: {
        userId,
        projectId: project.id,
        type: 'MILESTONE',
        title: `创建了项目：${data.title}`,
        content: data.description,
        abilitySignals: JSON.stringify(['craft']),
      },
    });

    // Recalculate ability scores
    await calculateAbilityScores(userId);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
