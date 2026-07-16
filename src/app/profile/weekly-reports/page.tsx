'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

export default function WeeklyReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/weekly-reports');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setReports(data.reports);
    } catch (err) {
      setError('加载周报列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/user/weekly-reports', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '生成失败');
      }
      await fetchReports();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const formatWeekRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
  };

  const hasThisWeekReport = () => {
    const now = new Date();
    return reports.some((r) => {
      const end = new Date(r.weekEnd);
      return end >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    });
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">周报</h1>
            <p className="text-slate-500 mt-1">查看你的成长周报</p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← 返回个人资料
          </Link>
        </div>

        {/* Generate Button */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-slate-900">生成本周周报</p>
              <p className="text-sm text-slate-500">基于你本周的成长记录自动生成</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || hasThisWeekReport()}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
                hasThisWeekReport()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : generating
                  ? 'bg-[#EDF3EB] text-[#7A9A75] cursor-wait'
                  : 'bg-[#3D5A37] text-white hover:bg-[#6B4E3D]'
              }`}
            >
              {generating ? '生成中...' : hasThisWeekReport() ? '本周已生成' : '生成周报'}
            </button>
          </div>
          {genError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {genError}
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">历史周报</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-3">{error}</p>
                <button
                  onClick={fetchReports}
                  className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
                >
                  重试
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-3">📊</p>
                <p className="text-slate-500">还没有周报</p>
                <button
                  onClick={handleGenerate}
                  className="mt-4 inline-block px-4 py-2 bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] transition text-sm"
                >
                  生成第一份周报
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/profile/weekly-reports/${report.id}`}
                    className="block bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatWeekRange(report.weekStart, report.weekEnd)}
                          </p>
                          <p className="text-xs text-slate-500">
                            生成于 {new Date(report.generatedAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400">→</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600">
                        <span className="font-bold text-slate-900">{report.recordCount}</span> 条记录
                      </span>
                      <span className="text-slate-600">
                        <span className="font-bold text-slate-900">{report.hoursInvested}</span> 小时投入
                      </span>
                      {report.abilityChanges && (
                        <span className="text-[#4A6B43] text-xs px-2 py-0.5 bg-[#EDF3EB] rounded-full">
                          能力有变化
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
