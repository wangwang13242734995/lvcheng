'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { useNotifications } from '@/hooks/useNotifications';

interface AbilityAverages {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
}

interface ChallengePerformance {
  id: string;
  title: string;
  category: string;
  status: string;
  applicants: number;
  submissions: number;
  approved: number;
  pending: number;
  conversionRate: number;
}

interface DistributionItem {
  name: string;
  value: number;
  fill?: string;
}

interface EnterpriseStats {
  totalChallenges: number;
  openCount: number;
  closedCount: number;
  completedCount: number;
  totalApplicants: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  pendingReview: number;
  abilityAverages: AbilityAverages;
  challengePerformance: ChallengePerformance[];
  applicationTrend: { date: string; count: number }[];
  submissionTrend: { date: string; count: number }[];
  reviewPendingTrend: { date: string; count: number }[];
  statusDistribution: DistributionItem[];
  categoryDistribution: DistributionItem[];
}

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const abilityLabels: Record<string, string> = {
  craft: '工艺',
  learn: '学习',
  drive: '驱动力',
  team: '协作',
  grit: '毅力',
  express: '表达',
};

export default function EnterpriseAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<EnterpriseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { unreadCount } = useNotifications();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/enterprise/stats');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('获取统计数据失败');
      }
      const data: EnterpriseStats = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch enterprise stats', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
        router.push('/challenges');
        return;
      }
      fetchStats();
    }
  }, [status, session, router, fetchStats]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
    return null;
  }

  if (!stats || stats.totalChallenges === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">企业数据看板</h1>
                <p className="text-slate-500 text-sm mt-1">发布挑战后查看数据表现</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/enterprise/notifications"
                  className="relative text-sm text-slate-600 hover:text-slate-900 transition"
                >
                  通知
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/enterprise" className="text-sm text-slate-600 hover:text-slate-900 transition">
                  ← 返回后台
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <span className="text-5xl mb-4 block">📊</span>
          <p className="text-slate-600 mb-2 font-medium">暂无挑战数据</p>
          <p className="text-slate-400 text-sm mb-6">发布第一个挑战后即可查看数据表现</p>
          <Link
            href="/challenges/new"
            className="inline-flex items-center gap-2 bg-[#4A3728] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#6B4E3D] transition"
          >
            + 发布挑战
          </Link>
        </div>
      </div>
    );
  }

  // 趋势图数据
  const trendChartData = stats.applicationTrend.map((a, i) => ({
    date: a.date,
    报名: a.count,
    提交: stats.submissionTrend[i]?.count || 0,
  }));

  // 雷达图数据
  const radarData = (Object.keys(abilityLabels) as Array<keyof AbilityAverages>).map((key) => ({
    dimension: abilityLabels[key],
    value: stats.abilityAverages[key],
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">企业数据看板</h1>
              <p className="text-slate-500 text-sm mt-1">挑战表现、候选人质量与转化分析</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/enterprise/notifications"
                className="relative text-sm text-slate-600 hover:text-slate-900 transition"
              >
                通知
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/enterprise" className="text-sm text-slate-600 hover:text-slate-900 transition">
                ← 返回后台
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '旗下挑战', value: stats.totalChallenges, color: 'text-slate-900', icon: '🎯' },
            { label: '进行中', value: stats.openCount, color: 'text-[#4A6B43]', icon: '🔥' },
            { label: '总报名', value: stats.totalApplicants, color: 'text-blue-600', icon: '📝' },
            { label: '总提交', value: stats.totalSubmissions, color: 'text-violet-600', icon: '📤' },
            { label: '已通过', value: stats.acceptedSubmissions, color: 'text-emerald-600', icon: '✅' },
            { label: '待评审', value: stats.pendingReview, color: 'text-amber-600', icon: '⏳' },
            { label: '已完成', value: stats.completedCount, color: 'text-indigo-600', icon: '🏁' },
            { label: '已关闭', value: stats.closedCount, color: 'text-slate-500', icon: '🔒' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-slate-500">{item.label}</p>
              </div>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* 趋势 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">最近 14 天报名与提交</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="报名" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="提交" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 候选人能力均值 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">候选人能力均值</h3>
            {stats.totalApplicants > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Radar
                      name="能力均值"
                      dataKey="value"
                      stroke="#047857"
                      fill="#047857"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">暂无候选人数据</div>
            )}
          </div>

          {/* 状态分布 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">挑战状态分布</h3>
            {stats.statusDistribution.some((d) => d.value > 0) ? (
              <div className="space-y-4 pt-2">
                {stats.statusDistribution.map((item) => {
                  const pct = stats.totalChallenges > 0 ? Math.round((item.value / stats.totalChallenges) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-600">{item.name}</span>
                        <span className="text-sm font-medium text-slate-700">
                          {item.value} <span className="text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">暂无数据</div>
            )}
          </div>
        </div>

        {/* 分类分布 */}
        {stats.categoryDistribution.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">挑战分类分布</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={stats.categoryDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v) => categoryLabels[v] || v}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => categoryLabels[v as string] || v}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {stats.categoryDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 旗下挑战表现 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">旗下挑战表现（最多 10 个）</h3>
          {stats.challengePerformance.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">挑战</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">状态</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">报名</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">提交</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">通过</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">待评审</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">转化率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.challengePerformance.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3">
                        <Link href={`/challenges/${c.id}`} className="text-sm font-medium text-slate-900 hover:text-[#7A9A75] transition">
                          {c.title}
                        </Link>
                        <p className="text-xs text-slate-400">{categoryLabels[c.category] || c.category}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === 'OPEN' ? 'bg-[#EDF3EB] text-[#7A9A75]' :
                          c.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {statusLabels[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-slate-700">{c.applicants}</td>
                      <td className="px-3 py-3 text-sm text-right text-slate-700">{c.submissions}</td>
                      <td className="px-3 py-3 text-sm text-right text-emerald-600 font-medium">{c.approved}</td>
                      <td className="px-3 py-3 text-sm text-right text-amber-600 font-medium">{c.pending}</td>
                      <td className="px-3 py-3 text-sm text-right">
                        <span className={`font-medium ${
                          c.conversionRate >= 50 ? 'text-emerald-600' :
                          c.conversionRate >= 20 ? 'text-amber-600' :
                          'text-slate-600'
                        }`}>
                          {c.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
