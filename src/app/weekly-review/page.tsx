'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const typeLabels: Record<string, string> = {
  COURSE: '课程作业',
  COMPETITION: '比赛',
  INTERNSHIP: '实习',
  PERSONAL: '个人项目',
  CHALLENGE: '挑战赛',
};

const recordTypeIcons: Record<string, string> = {
  MILESTONE: '🎯',
  PROBLEM_SOLVED: '💡',
  NEW_SKILL: '📚',
  REFLECTION: '🪞',
};

export default function WeeklyReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/weekly-review')
        .then(r => r.json())
        .then(setReview)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (!review) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center"><p className="text-slate-400">加载失败</p></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm transition">← 返回仪表盘</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">本周复盘</h1>
        <p className="text-slate-500">{review.weekLabel}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
        <p className="text-lg text-slate-700 leading-relaxed">{review.summary}</p>

        {/* Highlights */}
        {review.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {review.highlights.map((h: string, i: number) => (
              <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-100">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ability Changes */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">能力变化</h2>

        {/* Total Score Change */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-4">
          <span className="text-slate-600">综合得分</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800">{review.abilityChanges.current.totalScore}</span>
            {review.abilityChanges.totalScoreChange !== 0 && (
              <span className={`text-sm font-medium ${review.abilityChanges.totalScoreChange > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {review.abilityChanges.totalScoreChange > 0 ? '+' : ''}{review.abilityChanges.totalScoreChange}
              </span>
            )}
          </div>
        </div>

        {/* Individual Changes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(review.abilityChanges.changes).map(([key, change]) => {
            const labels: Record<string, string> = {
              craft: '专业力', learn: '学习力', drive: '自驱力',
              team: '协作力', grit: '抗压力', express: '表达力',
            };
            const currentVal = (review.abilityChanges.current as any)[key] || 30;
            const changeVal = change as number;

            return (
              <div key={key} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{labels[key]}</span>
                  {changeVal > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">+{changeVal}</span>
                  )}
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">{currentVal}</p>
              </div>
            );
          })}
        </div>

        {/* Biggest Gain */}
        {review.abilityChanges.biggestGain.value > 0 && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-700">
              🌟 本周最大进步：<strong>{review.abilityChanges.biggestGain.label}</strong> 提升了 {review.abilityChanges.biggestGain.value} 分
            </p>
          </div>
        )}
      </div>

      {/* Projects This Week */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          本周项目 <span className="text-slate-400 font-normal text-base">({review.projects.count})</span>
        </h2>
        {review.projects.count > 0 ? (
          <div className="space-y-3">
            {review.projects.items.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{p.title}</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    {typeLabels[p.type] || p.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm py-4 text-center">
            这周还没有新项目。
            <Link href="/projects/new" className="text-amber-600 hover:underline ml-1">记录一个 →</Link>
          </p>
        )}
      </div>

      {/* Growth Records This Week */}
      {review.growthRecords.count > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            成长轨迹 <span className="text-slate-400 font-normal text-base">({review.growthRecords.count})</span>
          </h2>
          <div className="space-y-2">
            {review.growthRecords.items.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-lg">{recordTypeIcons[r.type] || '📝'}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{r.title}</p>
                  <p className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center py-8">
        <Link
          href="/projects/new"
          className="inline-block bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition font-medium"
        >
          继续记录项目 →
        </Link>
      </div>
    </div>
  );
}
