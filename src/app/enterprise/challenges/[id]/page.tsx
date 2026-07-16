'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { isValidUrl } from '@/lib/sanitize';

interface User {
  id: string;
  name: string;
  email: string;
  major: string | null;
  avatar: string | null;
  bio: string | null;
  skills: string | null;
}

interface SubmissionPreview {
  id: string;
  status: string;
  title: string;
  createdAt: string;
}

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  user: User;
  submission: SubmissionPreview | null;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  solutionUrl: string | null;
  attachments: string | null;
  status: string;
  reviewComment: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: User;
  application: {
    id: string;
    status: string;
    appliedAt: string;
  } | null;
}

interface Challenge {
  id: string;
  title: string;
  company: string;
  category: string;
  status: string;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  spots: number | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: '待审核',
  ACCEPTED: '已通过',
  REJECTED: '已拒绝',
  OPEN: '进行中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-[#EDF3EB] text-[#7A9A75]',
  REJECTED: 'bg-red-100 text-red-700',
  OPEN: 'bg-[#EDF3EB] text-[#7A9A75]',
  CLOSED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

export default function EnterpriseChallengeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'submissions'>('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rewardResult, setRewardResult] = useState<{
    badge: boolean;
    certificate: boolean;
    abilityScores: any;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'TECH',
    reward: '',
    rewardAmount: 0,
    rewardType: 'CERTIFICATE',
    deadline: '',
    spots: 0,
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);

    try {
      const [challengeRes, appRes, subRes] = await Promise.all([
        fetch(`/api/challenges/${challengeId}`),
        fetch(`/api/enterprise/challenges/${challengeId}/applications`),
        fetch(`/api/enterprise/challenges/${challengeId}/submissions`),
      ]);

      if (challengeRes.status === 401 || challengeRes.status === 403 ||
          appRes.status === 401 || appRes.status === 403) {
        router.push('/challenges');
        return;
      }

      if (!challengeRes.ok) throw new Error('获取挑战详情失败');
      if (!appRes.ok) throw new Error('获取报名者失败');
      if (!subRes.ok) throw new Error('获取提交失败');

      const challengeData = await challengeRes.json();
      const appData = await appRes.json();
      const subData = await subRes.json();

      setChallenge(challengeData);
      setApplications(appData.applications || []);
      setSubmissions(subData.submissions || []);
    } catch (err) {
      console.error('Failed to load challenge detail:', err);
      setError('加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [challengeId, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'ENTERPRISE' && role !== 'ADMIN') {
        router.push('/challenges');
        return;
      }
      fetchAll();
    }
  }, [status, session, challengeId, router, fetchAll]);

  const isEnterprise = (session?.user as any)?.role === 'ENTERPRISE' || (session?.user as any)?.role === 'ADMIN';

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setProcessingId(applicationId);
    try {
      const res = await fetch(
        `/api/enterprise/challenges/${challengeId}/applications?applicationId=${applicationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '审核失败');
      }

      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '审核失败');
    } finally {
      setProcessingId(null);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    setProcessingId(submissionId);
    try {
      const res = await fetch(
        `/api/enterprise/challenges/${challengeId}/submissions?submissionId=${submissionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            reviewComment: reviewComment || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '审核失败');
      }

      const data = await res.json();
      if (data.rewards) {
        setRewardResult(data.rewards);
      } else {
        setSelectedSubmission(null);
        setReviewComment('');
      }
      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '审核失败');
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = () => {
    if (!challenge) return;
    setEditForm({
      title: challenge.title,
      description: '',
      category: challenge.category,
      reward: '',
      rewardAmount: challenge.rewardAmount,
      rewardType: challenge.rewardType,
      deadline: challenge.deadline ? challenge.deadline.split('T')[0] : '',
      spots: challenge.spots || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/enterprise/challenges/${challengeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '编辑失败');
      }
      setShowEditModal(false);
      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '编辑失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/enterprise/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '状态更新失败');
      }
      setShowStatusModal(false);
      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '状态更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const renderUserInfo = (user: User, showLink = true) => (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-[#EDF3EB] flex items-center justify-center text-[#6B4E3D] font-bold text-sm shrink-0">
        {user.name.charAt(0)}
      </div>
      <div className="min-w-0">
        {showLink ? (
          <Link
            href={`/profile/${user.id}`}
            className="font-medium text-slate-900 hover:text-[#7A9A75] truncate transition"
          >
            {user.name}
          </Link>
        ) : (
            <p className="font-medium text-slate-900 truncate">{user.name}</p>
          )}
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          {user.major && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {user.major}
            </p>
          )}
      </div>
    </div>
  );

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
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/enterprise" className="hover:text-slate-900 transition">企业后台</Link>
            <span>/</span>
            <span>挑战详情</span>
          </div>

          {loading || !challenge ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[challenge.status] || 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[challenge.status] || challenge.status}
                  </span>
                  <span className="text-xs text-slate-400">{categoryLabels[challenge.category] || challenge.category}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{challenge.title}</h1>
                <p className="text-slate-500 text-sm mt-1">{challenge.company}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {challenge.status === 'OPEN' && (
                  <button
                    onClick={openEditModal}
                    className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    编辑
                  </button>
                )}
                {challenge.status === 'OPEN' && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    关闭挑战
                  </button>
                )}
                {challenge.status === 'CLOSED' && (
                  <button
                    onClick={() => handleStatusChange('OPEN')}
                    disabled={editLoading}
                    className="px-3 py-1.5 text-sm font-medium bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
                  >
                    重新开启
                  </button>
                )}
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="text-sm text-slate-600 hover:text-slate-900 transition"
                >
                  查看公开页 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              重新加载
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-3xl font-bold text-slate-900">{applications.length}</p>
                <p className="text-sm text-slate-500 mt-1">报名人数</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-3xl font-bold text-[#4A6B43]">
                  {applications.filter((a) => a.status === 'ACCEPTED').length}
                </p>
                <p className="text-sm text-slate-500 mt-1">已通过</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-3xl font-bold text-blue-600">{submissions.length}</p>
                <p className="text-sm text-slate-500 mt-1">提交数</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-3xl font-bold text-violet-600">
                  {submissions.filter((s) => s.status === 'ACCEPTED').length}
                </p>
                <p className="text-sm text-slate-500 mt-1">提交已通过</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 mb-6">
              <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-6 py-4 text-sm font-medium transition ${
                      activeTab === 'applications'
                        ? 'text-[#6B4E3D] border-b-2 border-[#6B4E3D]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    报名者管理
                  </button>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-6 py-4 text-sm font-medium transition ${
                      activeTab === 'submissions'
                        ? 'text-[#6B4E3D] border-b-2 border-[#6B4E3D]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    提交管理
                  </button>
                </div>
                <button
                  onClick={() => {
                    const type = activeTab === 'applications' ? 'applications' : 'submissions';
                    window.open(`/api/enterprise/challenges/${challengeId}/export?type=${type}`, '_blank');
                  }}
                  className="mr-4 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  导出 CSV
                </button>
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-4 animate-pulse">
                        <div className="h-5 bg-slate-100 rounded w-1/4 mb-2" />
                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'applications' ? (
                  applications.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500">暂无报名者</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            {renderUserInfo(app.user)}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[app.status] || 'bg-slate-100 text-slate-600'}`}>
                                {statusLabels[app.status] || app.status}
                              </span>
                              {app.submission && (
                                <span className="text-xs text-slate-400">已提交</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-slate-400">
                              报名于 {new Date(app.appliedAt).toLocaleDateString('zh-CN')}
                            </span>
                            <div className="flex items-center gap-2">
                              {app.status !== 'ACCEPTED' && (
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'ACCEPTED')}
                                  disabled={processingId === app.id}
                                  className="px-3 py-1.5 text-xs font-medium bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
                                >
                                  通过
                                </button>
                              )}
                              {app.status !== 'REJECTED' && (
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                                  disabled={processingId === app.id}
                                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
                                >
                                  拒绝
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">暂无提交</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          {renderUserInfo(sub.user)}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[sub.status] || 'bg-slate-100 text-slate-600'} shrink-0`}>
                            {statusLabels[sub.status] || sub.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="font-medium text-slate-900">{sub.title}</p>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{sub.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>提交于 {new Date(sub.createdAt).toLocaleDateString('zh-CN')}</span>
                            {sub.solutionUrl && isValidUrl(sub.solutionUrl) && (
                              <a
                                href={sub.solutionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7A9A75] hover:text-[#6B4E3D]"
                              >
                                作品链接 →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4">
                          {sub.status === 'ACCEPTED' && sub.reviewComment && (
                            <span className="text-xs text-[#4A6B43] mr-auto">评审意见：{sub.reviewComment}</span>
                          )}
                          {sub.status !== 'PENDING' && sub.reviewedAt && (
                            <span className="text-xs text-slate-400">
                              评审于 {new Date(sub.reviewedAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                          {sub.status === 'ACCEPTED' && (
                            <span className="text-xs text-[#4A6B43] font-medium">🏅 奖励已发放</span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setReviewComment(sub.reviewComment || '');
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            审核
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedSubmission && !rewardResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">审核提交</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedSubmission.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">提交者</p>
                <p className="font-medium text-slate-900">{selectedSubmission.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">描述</p>
                <p className="text-sm text-slate-700">{selectedSubmission.description}</p>
              </div>
              {selectedSubmission.solutionUrl && isValidUrl(selectedSubmission.solutionUrl) && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">作品链接</p>
                  <a
                    href={selectedSubmission.solutionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#7A9A75] hover:text-[#6B4E3D] break-all"
                  >
                    {selectedSubmission.solutionUrl}
                  </a>
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-500 mb-1">审核评语</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  placeholder="可选，最多1000字"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setReviewComment('');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'REJECTED')}
                disabled={processingId === selectedSubmission.id}
                className="px-4 py-2 text-sm bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                拒绝
              </button>
              <button
                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'ACCEPTED')}
                disabled={processingId === selectedSubmission.id}
                className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
              >
                通过
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Result Modal */}
      {rewardResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">评审通过 - 奖励已发放</h3>
              <p className="text-sm text-slate-500 mt-1">以下奖励已自动发放给提交者</p>
            </div>
            <div className="p-6 space-y-4">
              {rewardResult.badge && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <p className="font-semibold text-slate-900">徽章已颁发</p>
                    <p className="text-sm text-slate-500">挑战完成徽章已自动颁发给用户</p>
                  </div>
                </div>
              )}
              {rewardResult.certificate && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <span className="text-2xl">📜</span>
                  <div>
                    <p className="font-semibold text-slate-900">证书已颁发</p>
                    <p className="text-sm text-slate-500">挑战完成证书已自动颁发给用户</p>
                  </div>
                </div>
              )}
              {rewardResult.abilityScores && (
                <div className="bg-[#F7FAF6] border border-[#D6E4D2] rounded-xl p-4">
                  <p className="font-semibold text-slate-900 mb-2">能力值已更新</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.craft}</p>
                      <p className="text-slate-500">匠心</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.learn}</p>
                      <p className="text-slate-500">学习</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.drive}</p>
                      <p className="text-slate-500">驱动</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.team}</p>
                      <p className="text-slate-500">协作</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.grit}</p>
                      <p className="text-slate-500">毅力</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#7A9A75] font-bold">{rewardResult.abilityScores.express}</p>
                      <p className="text-slate-500">表达</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => {
                  setRewardResult(null);
                  setSelectedSubmission(null);
                  setReviewComment('');
                }}
                className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] transition"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">编辑挑战</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">挑战标题</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">挑战分类</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                >
                  <option value="TECH">技术</option>
                  <option value="PRODUCT">产品</option>
                  <option value="GROWTH">增长</option>
                  <option value="MARKETING">营销</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">奖励类型</label>
                <select
                  value={editForm.rewardType}
                  onChange={(e) => setEditForm({ ...editForm, rewardType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                >
                  <option value="CERTIFICATE">证书</option>
                  <option value="CASH">现金</option>
                  <option value="PRIZE">奖品</option>
                  <option value="INTERNSHIP">实习机会</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">奖励金额</label>
                <input
                  type="number"
                  value={editForm.rewardAmount}
                  onChange={(e) => setEditForm({ ...editForm, rewardAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名额</label>
                <input
                  type="number"
                  value={editForm.spots}
                  onChange={(e) => setEditForm({ ...editForm, spots: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4E3D]/20"
                  placeholder="0 表示不限"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="px-4 py-2 text-sm bg-[#3D5A37] text-white rounded-lg hover:bg-[#6B4E3D] disabled:opacity-50 transition"
              >
                {editLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Challenge Confirmation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">关闭挑战</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                关闭后，新用户将无法报名此挑战。已报名的用户仍可提交作品。所有报名者将收到通知。
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  确认要关闭「{challenge?.title}」挑战吗？
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange('CLOSED')}
                disabled={editLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {editLoading ? '处理中...' : '确认关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
