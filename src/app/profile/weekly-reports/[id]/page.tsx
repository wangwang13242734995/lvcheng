'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  recordCount: number;
  hoursInvested: number;
  abilityChanges: string | null;
  aiSuggestion: string | null;
  generatedAt: string;
}

const dimLabels: Record<string, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

const dimColors: Record<string, string> = {
  craft: 'text-blue-600 bg-blue-100',
  learn: 'text-[#4A6B43] bg-[#EDF3EB]',
  drive: 'text-yellow-600 bg-yellow-100',
  team: 'text-purple-600 bg-purple-100',
  grit: 'text-red-600 bg-red-100',
  express: 'text-pink-600 bg-pink-100',
};

export default function WeeklyReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/weekly-reports/${id}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError('加载周报详情失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatWeekRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
  };

  const parseAbilityChanges = (json: string | null): Record<string, number> => {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">周报详情</h1>
          </div>
          <Link
            href="/profile/weekly-reports"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← 返回周报列表
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        ) : error || !report ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-3">{error || '周报不存在'}</p>
            <button
              onClick={fetchReport}
              className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Week Info */}
            <div className="bg-gradient-to-br from-[#7A9A75] to-[#4A3728] rounded-2xl p-6 text-white">
              <p className="text-[#D6E4D2] text-sm mb-1">统计周期</p>
              <p className="text-2xl font-bold">
                {formatWeekRange(report.weekStart, report.weekEnd)}
              </p>
              <p className="text-xs text-[#B3CEAD] mt-2">
                生成于 {new Date(report.generatedAt).toLocaleString('zh-CN')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <p className="text-4xl font-bold text-slate-900">{report.recordCount}</p>
                <p className="text-sm text-slate-500 mt-1">新增记录</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <p className="text-4xl font-bold text-blue-600">{report.hoursInvested}</p>
                <p className="text-sm text-slate-500 mt-1">投入小时</p>
              </div>
            </div>

            {/* Ability Changes */}
            {report.abilityChanges && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">能力变化</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parseAbilityChanges(report.abilityChanges)).map(
                    ([key, value]) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                          value > 0
                            ? dimColors[key]?.replace('text-', 'text-green-').replace('bg-', 'bg-green-') || 'text-[#7A9A75] bg-[#EDF3EB]'
                            : 'text-red-700 bg-red-100'
                        }`}
                      >
                        {dimLabels[key] || key}
                        <span className="font-bold">{value > 0 ? '+' : ''}{value}</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* AI Suggestion */}
            {report.aiSuggestion && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>💡</span> 成长建议
                </h2>
                <p className="text-amber-800 leading-relaxed">{report.aiSuggestion}</p>
              </div>
            )}

            {/* No Data Hint */}
            {report.recordCount === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <p className="text-5xl mb-3">📝</p>
                <p className="text-slate-500 mb-4">本周暂无记录</p>
                <Link
                  href="/projects/new"
                  className="inline-block px-4 py-2 bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] transition text-sm"
                >
                  去添加项目
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
