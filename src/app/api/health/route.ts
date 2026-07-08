import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let databaseStatus = 'ok';
  let databaseLatency = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatency = Date.now() - start;
  } catch (error) {
    databaseStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: databaseStatus,
        latencyMs: databaseLatency,
      },
    },
    uptime: process.uptime(),
  });
}
