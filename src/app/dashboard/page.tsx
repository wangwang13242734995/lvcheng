'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AbilityRadarChart from '@/components/AbilityRadarChart';
import ShareCard from '@/components/ShareCard';

interface DashboardData {
  score: {
    craft: number;
    learn: number;
    drive: number;
    team: number;
    grit: number;
    express: number;
    totalScore: number;
  } | null;
  user: any;
  projects: any[];
  growthRecords: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/ability')
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };
  const scores = data?.score || defaultScores;

  // AI suggestion based on lowest scores
  const scoreEntries = [
    { key: 'craft', label: '专业力' },
    { key: 'learn', label: '学习力' },
    { key: 'drive', label: '自驱力' },
    { key: 'team', label: '协作力' },
    { key: 'grit', label: '抗压力' },
    { key: 'express', label: '表达力' },
  ];
  const sorted = scoreEntries.sort((a, b) => (scores as any)[a.key] - (scores as any)[b.key]);
  const weakest = sorted[0];
  const suggestions: Record<string, string> = {
    craft: '尝试记录一个新项目，提升专业力评分。',
    learn: '尝试不同领域的项目，拓宽技术栈。',
    drive: '开始一个个人项目，展现自驱力。',
    team: '参与团队协作项目，提升协作力。',
    grit: '记录项目中遇到的困难和解决方案。',
    express: '完善项目描述，让记录更结构化。',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{session?.user?.name} 👋
        </h1>
        <Link
          href="/projects/new"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition text-sm font-medium"
        >
          + 记录新项目
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">六维能力快照</h2>
          <AbilityRadarChart scores={scores} />
          <p className="text-center text-slate-500 text-sm mt-2">
            综合得分：<span className="text-amber-600 font-bold text-lg">{scores.totalScore || 30}</span>
          </p>
        </div>

        {/* Stats & Suggestion */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-3">成长数据</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-800">{data?.projects?.length || 0}</p>
                <p className="text-xs text-slate-500">项目总数</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{data?.growthRecords?.length || 0}</p>
                <p className="text-xs text-slate-500">成长记录</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-2 text-amber-900">💡 AI 建议</h2>
            <p className="text-amber-700 text-sm">
              你的<strong>{weakest.label}</strong>还有提升空间。{suggestions[weakest.key]}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">最近记录</h2>
        {data?.growthRecords && data.growthRecords.length > 0 ? (
          <div className="space-y-3">
            {data.growthRecords.slice(0, 5).map((record: any) => (
              <div key={record.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-lg">
                  {record.type === 'MILESTONE' ? '🎯' :
                   record.type === 'PROBLEM_SOLVED' ? '💡' :
                   record.type === 'NEW_SKILL' ? '📚' :
                   record.type === 'COMPETITION' ? '🏆' : '💬'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{record.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            还没有记录，{' '}
            <Link href="/projects/new" className="text-amber-600 hover:underline font-medium">
              开始记录第一个项目
            </Link>
          </p>
        )}
      </div>

      {/* 分享卡片 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">分享你的能力名片</h2>
        <ShareCard
          userName={session?.user?.name || ''}
          scores={scores}
          projectCount={data?.projects?.length || 0}
          growthCount={data?.growthRecords?.length || 0}
        />
      </div>
    </div>
  );
}
