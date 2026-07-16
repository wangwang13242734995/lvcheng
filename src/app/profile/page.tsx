'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { sanitizeInput } from '@/lib/sanitize';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  major: string | null;
  graduationYear: number | null;
  bio: string | null;
  skills: string | null;
}

interface AbilityScore {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [abilityScore, setAbilityScore] = useState<AbilityScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const updateEditData = (field: Partial<User>) => {
    setEditData((prev) => (prev ? { ...prev, ...field } : prev));
  };

  useEffect(() => {
    fetchUserData();
    fetchAbilityScore();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('获取用户信息失败');
      const data = await res.json();
      setUser(data);
      setEditData(data);
    } catch {
      setError('获取用户信息失败');
    }
  };

  const fetchAbilityScore = async () => {
    try {
      const res = await fetch('/api/user/ability-radar');
      if (res.ok) {
        const data = await res.json();
        if (data.latest) {
          setAbilityScore({
            craft: data.latest.craft,
            learn: data.latest.learn,
            drive: data.latest.drive,
            team: data.latest.team,
            grit: data.latest.grit,
            express: data.latest.express,
            totalScore: data.latest.totalScore,
          });
        }
      }
    } catch {
      console.error('Failed to fetch ability score');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user);
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizeInput(editData.name),
          major: editData.major ? sanitizeInput(editData.major) : null,
          graduationYear: editData.graduationYear,
          bio: editData.bio ? sanitizeInput(editData.bio) : null,
          skills: editData.skills ? sanitizeInput(editData.skills) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '保存失败');
        return;
      }

      setMessage('保存成功');
      setIsEditing(false);
      fetchUserData();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('保存失败');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="text-[#4A3728]">加载中...</div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '删除我的账号') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '删除失败');
        setDeleting(false);
        return;
      }
      await signOut({ redirect: false });
      router.push('/');
    } catch {
      setError('删除账号失败');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-[#4A3728] via-[#2C1F14] to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#4A3728] to-[#2C1F14] p-6">
            <h1 className="text-2xl font-bold text-white">个人资料</h1>
            <p className="text-[#D6E4D2] text-sm mt-1">管理你的个人信息</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-[#F7FAF6] text-[#4A6B43] p-3 rounded-xl mb-4 text-sm">
                {message}
              </div>
            )}

            {/* Ability Score Card */}
            {abilityScore && (
              <Link
                href="/profile/ability"
                className="flex items-center justify-between bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-xl p-4 mb-3 hover:from-[#6B4E3D] hover:to-[#4A3728] transition group text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl">
                    ⬡
                  </div>
                  <div>
                    <p className="font-semibold">能力雷达</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-lg font-bold">{abilityScore.totalScore}</span>
                      <span className="text-xs text-[#D6E4D2]">综合分</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { key: 'craft', label: '专业', value: abilityScore.craft },
                    { key: 'learn', label: '学习', value: abilityScore.learn },
                    { key: 'drive', label: '自驱', value: abilityScore.drive },
                    { key: 'team', label: '协作', value: abilityScore.team },
                    { key: 'grit', label: '抗压', value: abilityScore.grit },
                    { key: 'express', label: '表达', value: abilityScore.express },
                  ].map((dim) => (
                    <div key={dim.key} className="text-center">
                      <p className="text-xs font-medium">{dim.value}</p>
                      <p className="text-[10px] text-[#B3CEAD]">{dim.label}</p>
                    </div>
                  ))}
                  <span className="text-slate-400 group-hover:text-white transition ml-2">→</span>
                </div>
              </Link>
            )}

            <Link
              href="/profile/achievements"
              className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-3 hover:from-amber-100 hover:to-yellow-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-xl shadow-sm">
                  🏅
                </div>
                <div>
                  <p className="font-semibold text-slate-900">我的成就</p>
                  <p className="text-xs text-slate-500">查看徽章和证书</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600 transition">→</span>
            </Link>

            <Link
              href="/profile/my-challenges"
              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-3 hover:from-blue-100 hover:to-cyan-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xl shadow-sm">
                  🎯
                </div>
                <div>
                  <p className="font-semibold text-slate-900">我的挑战</p>
                  <p className="text-xs text-slate-500">追踪报名与提交状态</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600 transition">→</span>
            </Link>

            <Link
              href="/profile/notifications"
              className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-3 hover:from-orange-100 hover:to-amber-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl shadow-sm">
                  🔔
                </div>
                <div>
                  <p className="font-semibold text-slate-900">通知中心</p>
                  <p className="text-xs text-slate-500">查看系统通知</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600 transition">→</span>
            </Link>

            <Link
              href="/profile/weekly-reports"
              className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 mb-6 hover:from-purple-100 hover:to-violet-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-xl shadow-sm">
                  📊
                </div>
                <div>
                  <p className="font-semibold text-slate-900">周报</p>
                  <p className="text-xs text-slate-500">查看成长周报</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600 transition">→</span>
            </Link>

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                <p className="text-slate-500 text-sm">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.name || ''}
                      onChange={(e) => updateEditData({ name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
                  <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">专业</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.major || ''}
                      onChange={(e) => updateEditData({ major: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                      placeholder="请输入专业"
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.major || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">毕业年份</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData?.graduationYear || ''}
                      onChange={(e) => updateEditData({ graduationYear: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                      placeholder="请输入毕业年份"
                      min={1900}
                      max={2099}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.graduationYear || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">个人简介</label>
                {isEditing ? (
                  <textarea
                    value={editData?.bio || ''}
                    onChange={(e) => updateEditData({ bio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                    placeholder="介绍一下你自己"
                    rows={3}
                  />
                ) : (
                  <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl whitespace-pre-wrap">{user.bio || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">技能特长</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.skills || ''}
                    onChange={(e) => updateEditData({ skills: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-transparent"
                    placeholder="用逗号分隔多个技能"
                  />
                ) : (
                  <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.skills || '-'}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] transition font-medium"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] transition font-medium"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>

          {/* 危险区域 - 删除账号 */}
          <div className="border-t border-red-100 mt-6 pt-6">
            <h3 className="text-sm font-semibold text-red-600 mb-2">危险区域</h3>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-500 hover:text-red-700 hover:underline"
              >
                删除账号及所有数据
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-700 mb-3">
                  此操作将永久删除你的账号、项目、能力数据等所有信息，不可恢复。
                  请输入 <span className="font-bold">删除我的账号</span> 以确认：
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3 text-sm"
                  placeholder="删除我的账号"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== '删除我的账号' || deleting}
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                  >
                    {deleting ? '删除中...' : '确认删除'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
