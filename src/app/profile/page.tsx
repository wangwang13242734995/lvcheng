'use client';

import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitize';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  school: string | null;
  major: string | null;
  graduationYear: number | null;
  bio: string | null;
  skills: string | null;
}

export default async function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('获取用户信息失败');
      const data = await res.json();
      setUser(data);
      setEditData(data);
    } catch (err) {
      setError('获取用户信息失败');
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
          school: editData.school ? sanitizeInput(editData.school) : null,
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
        <div className="text-green-900">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-green-900 via-green-950 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-900 to-green-950 p-6">
            <h1 className="text-2xl font-bold text-white">个人资料</h1>
            <p className="text-green-200 text-sm mt-1">管理你的个人信息</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">
                {message}
              </div>
            )}

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-900 to-green-950 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
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
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">学校</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.school || ''}
                      onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="请输入学校"
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.school || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">专业</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.major || ''}
                      onChange={(e) => setEditData({ ...editData, major: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="请输入专业"
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.major || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">毕业年份</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.graduationYear || ''}
                    onChange={(e) => setEditData({ ...editData, graduationYear: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="请输入毕业年份"
                    min={1900}
                    max={2099}
                  />
                ) : (
                  <p className="text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl">{user.graduationYear || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">个人简介</label>
                {isEditing ? (
                  <textarea
                    value={editData.bio || ''}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    value={editData.skills || ''}
                    onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="flex-1 bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 transition font-medium"
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
                  className="flex-1 bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 transition font-medium"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
