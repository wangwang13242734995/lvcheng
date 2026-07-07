'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AbilityRadarChart from '@/components/AbilityRadarChart';
import ShareCard from '@/components/ShareCard';
import AchievementPanel from '@/components/AchievementPanel';

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
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-green-500 rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">加载中...</p>
      </div>
    );
  }

  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };
  const scores = data?.score || defaultScores;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            你好，{session?.user?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">继续积累，让能力被看见</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-gradient-to-r from-green-900 to-green-950 text-white px-5 py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 transition text-sm font-medium shadow-sm"
        >
          + 记录新项目
        </Link>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Weekly Review */}
        <Link
          href="/weekly-review"
          className="group bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 hover:border-green-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📊</div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">本周复盘</h3>
              <p className="text-xs text-slate-500 mt-0.5">看看这周你的能力变化</p>
            </div>
            <span className="text-green-600 text-sm font-medium group-hover:translate-x-1 transition-transform">查看 →</span>
          </div>
        </Link>

        {/* Profile Card */}
        <Link
          href={`/profile/${(session?.user as any)?.id}`}
          className="group bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🪪</div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">能力名片</h3>
              <p className="text-xs text-slate-500 mt-0.5">你的专属能力展示卡</p>
            </div>
            <span className="text-orange-600 text-sm font-medium group-hover:translate-x-1 transition-transform">查看 →</span>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        {/* Radar Chart - 3 cols */}
        <div className="md:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">⬡</span>
            六维能力
          </h2>
          <AbilityRadarChart scores={scores} />
          <div className="flex items-center justify-center mt-4 gap-2">
            <span className="text-sm text-slate-500">综合得分</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{scores.totalScore || 30}</span>
          </div>
        </div>

        {/* Stats - 2 cols */}
        <div className="md:col-span-2 space-y-4">
          {/* Project Count */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">📁</div>
              <h2 className="font-bold text-slate-900">成长数据</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-100">
                <p className="text-3xl font-bold text-slate-800">{data?.projects?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">项目总数</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-b from-emerald-50/50 to-white rounded-xl border border-emerald-100/60">
                <p className="text-3xl font-bold text-emerald-600">{data?.growthRecords?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">成长记录</p>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 p-6 rounded-2xl border border-orange-200/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h2 className="font-bold text-orange-900">AI 建议</h2>
            </div>
            <p className="text-orange-800 text-sm leading-relaxed">
              你的<strong>{weakest.label}</strong>还有提升空间。{suggestions[weakest.key]}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 text-sm">📋</span>
          最近记录
        </h2>
        {data?.growthRecords && data.growthRecords.length > 0 ? (
          <div className="space-y-3">
            {data.growthRecords.slice(0, 5).map((record: any) => (
              <div key={record.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xl w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {record.type === 'MILESTONE' ? '🎯' :
                   record.type === 'PROBLEM_SOLVED' ? '💡' :
                   record.type === 'NEW_SKILL' ? '📚' :
                   record.type === 'COMPETITION' ? '🏆' : '💬'}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{record.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400 mb-3">还没有记录</p>
            <Link href="/projects/new" className="text-green-600 hover:text-green-700 font-medium text-sm">
              开始记录第一个项目 →
            </Link>
          </div>
        )}
      </div>

      {/* Achievement System */}
      <div className="mb-8">
        <AchievementPanel
          scores={scores}
          projectCount={data?.projects?.length || 0}
        />
      </div>

      {/* Share Card */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm">🔗</span>
          分享你的能力名片
        </h2>
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
