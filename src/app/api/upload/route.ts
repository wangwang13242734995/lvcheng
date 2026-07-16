import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mov'];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 MP4、WebM、MOV 格式' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 50MB' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', userId);
    await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const videoUrl = `/uploads/${userId}/${filename}`;
    return NextResponse.json({ videoUrl }, { status: 201 });
  } catch (error) {
    logger.error('Upload error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '上传失败，请稍后重试' }, { status: 500 });
  }
}
