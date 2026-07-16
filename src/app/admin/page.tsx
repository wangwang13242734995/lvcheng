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
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalChallenges: number;
  totalProjects: number;
  totalBadges: number;
  totalCertificates: number;
  totalSubmissions: number;
  totalApplications: number;
  newUsersToday: number;
  activeChallenges: number;
  roleStats: { role: string; _count: { role: number } }[];
  challengeStats: { status: string; _count: { status: number } }[];
  userTrend: { date: string; count: number }[];
  challengeTrend: { date: string; count: number }[];
  categoryStats: { category: string; _count: { category: number } }[];
  conversionFunnel: {
    applications: number;
    submissions: number;
    accepted: number;
  };
}

const roleLabels: Record<string, string> = {
  STUDENT: '学生/求职者',
  ENTERPRISE: '企业用户',
  ADMIN: '管理员',
};

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
  PENDING: '待审核',
};

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

const CATEGORY_COLORS = ['#1e40af', '#047857', '#b45309', '#9333ea'];
const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#10b981'];

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('获取统计数据失败');
      const data: AdminStats = await res.json();
      setStats(data);
    } catch {
      console.error('Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ADMIN') {
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

  if ((session?.user as any)?.role !== 'ADMIN' || !stats) {
    return null;
  }

  const trendChartData = stats.userTrend.map((u, i) => ({
    date: u.date,
    用户: u.count,
    挑战: stats.challengeTrend[i]?.count || 0,
  }));

  const categoryChartData = stats.categoryStats.map((c) => ({
    name: categoryLabels[c.category] || c.category,
    value: c._count.category,
  }));

  const funnelChartData = [
    { name: '报名', value: stats.conversionFunnel.applications, fill: FUNNEL_COLORS[0] },
    { name: '提交', value: stats.conversionFunnel.submissions, fill: FUNNEL_COLORS[1] },
    { name: '通过', value: stats.conversionFunnel.accepted, fill: FUNNEL_COLORS[2] },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">运营数据看板</h1>
              <p className="text-slate-500 text-sm mt-1">平台数据概览、趋势与转化分析</p>
            </div>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              返回首页 →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '总用户数', value: stats.totalUsers, color: 'text-blue-600', icon: '👥' },
            { label: '新增用户(今日)', value: stats.newUsersToday, color: 'text-[#4A6B43]', icon: '🆕' },
            { label: '挑战总数', value: stats.totalChallenges, color: 'text-violet-600', icon: '🎯' },
            { label: '进行中挑战', value: stats.activeChallenges, color: 'text-amber-600', icon: '🔥' },
            { label: '项目总数', value: stats.totalProjects, color: 'text-slate-600', icon: '📁' },
            { label: '总报名数', value: stats.totalApplications, color: 'text-cyan-600', icon: '📝' },
            { label: '总提交数', value: stats.totalSubmissions, color: 'text-indigo-600', icon: '📤' },
            { label: '徽章颁发数', value: stats.totalBadges, color: 'text-amber-500', icon: '🏅' },
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

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">最近 14 天趋势</h3>
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
                <Line
                  type="monotone"
                  dataKey="用户"
                  stroke="#047857"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="挑战"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">挑战分类分布</h3>
            {categoryChartData.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryChartData.map((_, idx) => (
                        <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">暂无数据</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">用户角色分布</h3>
            <div className="space-y-3">
              {stats.roleStats.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {roleLabels[item.role] || item.role}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3D5A37] rounded-full"
                        style={{
                          width: `${stats.totalUsers > 0 ? (item._count.role / stats.totalUsers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-12 text-right">
                      {item._count.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">挑战状态分布</h3>
            <div className="space-y-3">
              {stats.challengeStats.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {statusLabels[item.status] || item.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${stats.totalChallenges > 0 ? (item._count.status / stats.totalChallenges) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-12 text-right">
                      {item._count.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">报名 → 提交 → 通过 转化漏斗</h3>
            {funnelChartData.some((d) => d.value > 0) ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={funnelChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {funnelChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">暂无转化数据</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              👥
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition">用户管理</h3>
            <p className="text-sm text-slate-500 mt-1">查看、修改用户角色和权限</p>
          </Link>

          <Link
            href="/admin/challenges"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-violet-200 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition">挑战管理</h3>
            <p className="text-sm text-slate-500 mt-1">审核、关闭平台挑战</p>
          </Link>

          <Link
            href="/profile/achievements"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-amber-200 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              🏅
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition">成就体系</h3>
            <p className="text-sm text-slate-500 mt-1">查看徽章和证书体系</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
