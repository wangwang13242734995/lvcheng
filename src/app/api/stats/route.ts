import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [userCount, projectCount, recordCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.growthRecord.count(),
    ]);

    return NextResponse.json({ userCount, projectCount, recordCount });
  } catch (error) {
    console.error('[stats API] error:', error);
    return NextResponse.json(
      { userCount: 0, projectCount: 0, recordCount: 0, error: String(error) },
      { status: 200 }
    );
  }
}
