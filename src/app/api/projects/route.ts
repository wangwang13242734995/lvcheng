import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateAbilityScores, getLatestAbilityScore } from '@/services/ability-engine';
import { sanitizeInput } from '@/lib/sanitize';

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
  videoUrl: z.string().optional(),
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
        status: data.status,
      },
    });

    const oldScores = await getLatestAbilityScore(userId);

    await prisma.growthRecord.create({
      data: {
        userId,
        projectId: project.id,
        type: 'MILESTONE',
        title: `创建了项目：${sanitizeInput(data.title)}`,
        content: data.description ? sanitizeInput(data.description) : undefined,
        abilitySignals: JSON.stringify(['craft']),
      },
    });

    await calculateAbilityScores(userId);

    const newScores = await getLatestAbilityScore(userId);

    const scoreChanges = newScores && oldScores ? {
      craft: newScores.craft - oldScores.craft,
      learn: newScores.learn - oldScores.learn,
      drive: newScores.drive - oldScores.drive,
      team: newScores.team - oldScores.team,
      grit: newScores.grit - oldScores.grit,
      express: newScores.express - oldScores.express,
      totalScore: newScores.totalScore - oldScores.totalScore,
    } : null;

    return NextResponse.json({ project, scoreChanges, newScores }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
