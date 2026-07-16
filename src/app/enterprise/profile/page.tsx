'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string | null;
}

interface Stats {
  totalChallenges: number;
  totalRewardAmount: number;
  totalApplications: number;
  totalSubmissions: number;
}

interface RecentChallenge {
  id: string;
  title: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
  applicantCount: number;
  submissionCount: number;
}

const statusLabels: Record<string, string> = {
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#EDF3EB] text-[#7A9A75]',
  CLOSED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

export default function EnterpriseProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentChallenges, setRecentChallenges] = useState<RecentChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', skills: '' });
  const [editError, setEditError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/enterprise/profile');
      if (res.status === 401 || res.status === 403) {
        router.push('/challenges');
        return;
      }
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setProfile(data.profile);
      setStats(data.stats);
      setRecentChallenges(data.recentChallenges);
    } catch (err) {
      setError('加载企业信息失败');
      console.error(err);
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
      fetchData();
    }
  }, [status, session, router, fetchData]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    try {
      const res = await fetch('/api/enterprise/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      setIsEditing(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        bio: profile.bio || '',
        skills: profile.skills || '',
      });
      setIsEditing(true);
    }
  };

  const isEnterprise = (session?.user as any)?.role === 'ENTERPRISE' || (session?.user as any)?.role === 'ADMIN';

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!isEnterprise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/enterprise" className="hover:text-slate-900 transition">企业后台</Link>
            <span>/</span>
            <span>企业资料</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">企业资料</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        ) : error || !profile ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-3">{error || '暂无数据'}</p>
            <button onClick={fetchData} className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]">
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#7A9A75] to-[#4A3728] p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                      {profile.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <p className="text-[#D6E4D2] text-sm mt-1">{profile.email}</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={handleEditClick}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                    >
                      编辑资料
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    {editError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        {editError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-slate-500 mb-1">企业名称 *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 mb-1">企业简介</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                        maxLength={2000}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 mb-1">业务领域</label>
                      <input
                        type="text"
                        value={editForm.skills}
                        onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                        maxLength={500}
                        placeholder="用逗号分隔，如：技术, 产品, 设计"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] transition"
                      >
                        保存
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {profile.bio && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">企业简介</p>
                        <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                    {profile.skills && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">业务领域</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.split(/[,，]/).map((skill) => (
                            <span
                              key={skill.trim()}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!profile.bio && !profile.skills && (
                      <div className="text-slate-400 text-sm">
                        点击编辑资料完善企业信息
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <p className="text-3xl font-bold text-slate-900">{stats.totalChallenges}</p>
                  <p className="text-sm text-slate-500 mt-1">发布挑战</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <p className="text-3xl font-bold text-amber-600">¥{stats.totalRewardAmount.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 mt-1">总奖金池</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalApplications}</p>
                  <p className="text-sm text-slate-500 mt-1">报名人数</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <p className="text-3xl font-bold text-[#4A6B43]">{stats.totalSubmissions}</p>
                  <p className="text-sm text-slate-500 mt-1">提交作品</p>
                </div>
              </div>
            )}

            {/* Recent Challenges */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">最近发布的挑战</h3>
                <Link href="/enterprise" className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]">
                  查看全部 →
                </Link>
              </div>
              <div className="p-6">
                {recentChallenges.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    还没有发布挑战
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentChallenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="bg-slate-50 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <Link
                            href={`/challenges/${challenge.id}`}
                            className="font-medium text-slate-900 hover:text-[#6B4E3D] transition"
                          >
                            {challenge.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className={`px-2 py-0.5 rounded-full ${statusColors[challenge.status]}`}>
                              {statusLabels[challenge.status]}
                            </span>
                            <span>报名 {challenge.applicantCount} 人</span>
                            <span>提交 {challenge.submissionCount} 份</span>
                          </div>
                        </div>
                        {challenge.rewardAmount > 0 && (
                          <span className="text-lg font-bold text-amber-600">
                            ¥{challenge.rewardAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
