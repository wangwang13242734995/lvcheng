import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [userCount, projectCount, recordCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.growthRecord.count(),
    ]);

    return NextResponse.json({ userCount, projectCount, recordCount });
  } catch {
    return NextResponse.json({ userCount: 0, projectCount: 0, recordCount: 0 });
  }
}
