import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeProject } from '@/services/project-parser';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analyzeSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  difficultyEncountered: z.string().max(500).optional(),
  solution: z.string().max(500).optional(),
  videoUrl: z.string().optional(),
  links: z.array(z.any()).optional(),
  existingTechStack: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const data = analyzeSchema.parse(body);

    const result = analyzeProject({
      title: data.title,
      description: data.description,
      difficultyEncountered: data.difficultyEncountered,
      solution: data.solution,
      videoUrl: data.videoUrl,
      links: data.links,
      existingTechStack: data.existingTechStack,
    });

    logger.info('Project analyzed', {
      userId: (session.user as any).id,
      techCount: result.techStack.length,
      difficulty: result.suggestedDifficulty,
      completeness: result.completenessScore,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    logger.error('Project analysis failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: '解析失败' }, { status: 500 });
  }
}
