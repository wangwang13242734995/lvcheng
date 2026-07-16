'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    projects: number;
    abilityScores: number;
  };
}

interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const roleLabels: Record<string, string> = {
  STUDENT: '学生/求职者',
  ENTERPRISE: '企业用户',
  ADMIN: '管理员',
};

const roleColors: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-[#EDF3EB] text-[#7A9A75]',
  ADMIN: 'bg-amber-100 text-amber-700',
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRole, setBatchRole] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('获取用户列表失败');
      }
      const data: UserListResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchUsers();
    }
  }, [status, session, fetchUsers, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openRoleModal = (user: AdminUser) => {
    setEditingUserId(user.id);
    setNewRole(user.role);
  };

  const closeRoleModal = () => {
    setEditingUserId(null);
    setNewRole('');
  };

  const handleRoleUpdate = async () => {
    if (!editingUserId) return;
    try {
      const res = await fetch(`/api/admin/users?id=${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '修改失败');
      }

      setMessage('用户角色已更新');
      closeRoleModal();
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败');
    }
  };

  const toggleSelect = (userId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBatchRoleUpdate = async () => {
    if (selectedIds.size === 0 || !batchRole) return;
    try {
      const res = await fetch('/api/admin/users/batch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds), role: batchRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '批量修改失败');
      }

      setMessage(`已更新 ${selectedIds.size} 个用户的角色`);
      setSelectedIds(new Set());
      setShowBatchModal(false);
      setBatchRole('');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量修改失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if ((session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
            <p className="text-slate-500 text-sm mt-1">共 {total} 个用户</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open('/api/admin/export/users', '_blank')}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              导出 CSV
            </button>
            <Link
              href="/admin"
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              ← 返回后台
            </Link>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-[#F7FAF6] border border-[#D6E4D2] text-[#4A6B43] p-4 rounded-xl mb-4 text-sm">
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名或邮箱"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A3728] text-white rounded-lg text-sm font-medium hover:bg-[#6B4E3D] transition"
              >
                搜索
              </button>
            </form>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">角色：</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
              >
                <option value="">全部</option>
                <option value="STUDENT">学生/求职者</option>
                <option value="ENTERPRISE">企业用户</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">已选择 {selectedIds.size} 个用户</span>
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-3 py-1.5 bg-[#4A3728] text-white rounded-lg text-sm font-medium hover:bg-[#6B4E3D] transition"
              >
                批量修改角色
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-slate-500 hover:text-slate-700 transition"
              >
                取消选择
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
            <span className="text-5xl mb-4 block">👥</span>
            <p className="text-slate-500">暂无用户</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#7A9A75] focus:ring-[#5D7A57]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">用户</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">角色</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">项目数</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">注册时间</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition ${selectedIds.has(user.id) ? 'bg-[#F7FAF6]' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#7A9A75] focus:ring-[#5D7A57]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B4E3D] to-[#2C1F14] flex items-center justify-center text-white font-medium text-sm">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${user.id}`}
                            className="font-medium text-slate-900 text-sm hover:text-[#7A9A75] transition"
                          >
                            {user.name}
                          </Link>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user._count.projects}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-sm text-slate-600 hover:text-slate-900 transition mr-3"
                      >
                        查看
                      </Link>
                      <button
                        onClick={() => openRoleModal(user)}
                        className="text-sm text-[#7A9A75] hover:text-[#6B4E3D] font-medium transition"
                      >
                        修改角色
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    page === pageNum
                      ? 'bg-[#4A3728] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              →
            </button>
          </div>
        )}
      </div>

      {editingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">修改用户角色</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-2">角色</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                >
                  <option value="STUDENT">学生/求职者</option>
                  <option value="ENTERPRISE">企业用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={closeRoleModal}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleRoleUpdate}
                className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] transition"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">批量修改角色</h3>
              <p className="text-sm text-slate-500 mt-1">已选择 {selectedIds.size} 个用户</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-2">新角色</label>
                <select
                  value={batchRole}
                  onChange={(e) => setBatchRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                >
                  <option value="">选择角色</option>
                  <option value="STUDENT">学生/求职者</option>
                  <option value="ENTERPRISE">企业用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowBatchModal(false); setBatchRole(''); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleBatchRoleUpdate}
                disabled={!batchRole}
                className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
