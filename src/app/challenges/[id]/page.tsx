'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const categoryLabels: Record<string, string> = {
  TECH: '技术',
  PRODUCT: '产品',
  GROWTH: '增长',
  MARKETING: '营销',
};

const categoryIcons: Record<string, string> = {
  TECH: '💻',
  PRODUCT: '🎨',
  GROWTH: '📈',
  MARKETING: '📣',
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [submission, setSubmission] = useState<any>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    solutionUrl: '',
    attachments: '',
  });

  useEffect(() => {
    fetch(`/api/challenges/${params.id}`)
      .then((res) => res.json())
      .then(setChallenge)
      .catch(() => {})
      .finally(() => setLoading(false));

    if (status === 'authenticated') {
      fetch(`/api/challenges/${params.id}/submit`)
        .then((res) => res.json())
        .then(setSubmission)
        .catch(() => {});
    }
  }, [params.id, status]);

  const handleApply = async () => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    setApplying(true);
    setMessage('');

    try {
      const res = await fetch(`/api/challenges/${params.id}/apply`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('🎉 报名成功！现在可以提交作品了。');
        setChallenge((prev: any) => ({
          ...prev,
          hasApplied: true,
          applicantCount: prev.applicantCount + 1,
        }));
        setTimeout(() => setShowSubmitForm(true), 1000);
      } else {
        setMessage(data.error || '报名失败');
      }
    } catch {
      setMessage('网络错误，请稍后重试');
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/challenges/${params.id}/apply`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('已取消报名');
        setChallenge((prev: any) => ({
          ...prev,
          hasApplied: false,
          applicantCount: prev.applicantCount - 1,
        }));
        setShowSubmitForm(false);
        setSubmission(null);
      } else {
        setMessage(data.error || '取消失败');
      }
    } catch {
      setMessage('网络错误');
    }
  };

  const handleSubmit = async () => {
    if (!submitForm.title || !submitForm.description) {
      setMessage('标题和描述不能为空');
      return;
    }

    setSubmitLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/challenges/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('🎉 作品提交成功！企业会在3-5个工作日内评审。');
        setSubmission(data.submission);
        setShowSubmitForm(false);
        setSubmitForm({ title: '', description: '', solutionUrl: '', attachments: '' });
      } else {
        setMessage(data.error || '提交失败');
      }
    } catch {
      setMessage('网络错误，请稍后重试');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-green-500 rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">加载中...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">挑战不存在</p>
        <Link href="/challenges" className="text-green-600 hover:underline mt-4 inline-block">
          ← 返回挑战广场
        </Link>
      </div>
    );
  }

  const abilityRequirements = [
    { label: '专业力', value: challenge.requiredCraft, icon: '🛠', key: 'craft' },
    { label: '学习力', value: challenge.requiredLearn, icon: '📚', key: 'learn' },
    { label: '自驱力', value: challenge.requiredDrive, icon: '⚡', key: 'drive' },
    { label: '协作力', value: challenge.requiredTeam, icon: '🤝', key: 'team' },
    { label: '抗压力', value: challenge.requiredGrit, icon: '🏔', key: 'grit' },
    { label: '表达力', value: challenge.requiredExpress, icon: '🎯', key: 'express' },
  ].filter((item) => item.value > 0);

  const statusLabels: Record<string, string> = {
    PENDING: '待评审',
    REVIEWED: '已评审',
    APPROVED: '✅ 通过',
    REJECTED: '❌ 未通过',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    REVIEWED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/20 text-white`}>
              {categoryIcons[challenge.category]} {categoryLabels[challenge.category]}
            </span>
            <span className="text-green-200/70 text-sm">{challenge.company}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">{challenge.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-green-200/70">
            <span>👥 {challenge.applicantCount}/{challenge.spots || '∞'} 人已报名</span>
            {challenge.deadline && (
              <span>⏰ 截止 {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 左侧：详情 */}
        <div className="md:col-span-2 space-y-6">
          {/* 挑战描述 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">📋</span>
              挑战详情
            </h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {challenge.description}
            </p>
          </div>

          {/* 能力要求 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm">⬡</span>
              能力要求
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {abilityRequirements.map((item) => (
                <div key={item.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-orange-600">≥ {item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              💡 完成挑战后，对应能力维度会获得额外加分
            </p>
          </div>

          {/* 作品提交区域 */}
          {(challenge.hasApplied || submission) && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm">📤</span>
                作品提交
              </h2>

              {submission ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[submission.status] || 'bg-slate-100 text-slate-700'}`}>
                      {statusLabels[submission.status] || submission.status}
                    </span>
                    {submission.status === 'PENDING' && (
                      <button
                        onClick={() => setShowSubmitForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        重新提交
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-2">{submission.title}</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{submission.description}</p>
                    {submission.solutionUrl && (
                      <div className="mt-2">
                        <a href={submission.solutionUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          🔗 {submission.solutionUrl}
                        </a>
                      </div>
                    )}
                    {submission.attachments && (
                      <div className="mt-2 text-sm text-slate-500">
                        📎 附件：{submission.attachments}
                      </div>
                    )}
                  </div>

                  {submission.reviewComment && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-sm font-medium text-green-700 mb-1">💬 企业评语</p>
                      <p className="text-sm text-green-600">{submission.reviewComment}</p>
                    </div>
                  )}
                </div>
              ) : showSubmitForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">作品标题</label>
                    <input
                      type="text"
                      value={submitForm.title}
                      onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="给你的作品起个名字"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">方案描述</label>
                    <textarea
                      value={submitForm.description}
                      onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                      placeholder="详细描述你的解决方案...&#10;&#10;建议包含：&#10;- 你是如何理解这个问题的&#10;- 你的解决思路和方法&#10;- 关键技术点或创新点&#10;- 遇到的困难及解决过程"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">解决方案链接（选填）</label>
                    <input
                      type="url"
                      value={submitForm.solutionUrl}
                      onChange={(e) => setSubmitForm({ ...submitForm, solutionUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="GitHub、线上演示地址等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">附件链接（选填）</label>
                    <input
                      type="text"
                      value={submitForm.attachments}
                      onChange={(e) => setSubmitForm({ ...submitForm, attachments: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="PDF、PPT、视频等链接，用逗号分隔"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      className="flex-1 bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 disabled:opacity-50 transition font-medium shadow-sm"
                    >
                      {submitLoading ? '提交中...' : '提交作品'}
                    </button>
                    <button
                      onClick={() => setShowSubmitForm(false)}
                      className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-500 hover:to-blue-600 transition font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <span>📤</span> 提交作品
                </button>
              )}
            </div>
          )}
        </div>

        {/* 右侧：报名 */}
        <div className="space-y-6">
          {/* 奖励 */}
          {challenge.reward && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 p-6 rounded-2xl border border-orange-200/60">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <span>🏆</span> 完成奖励
              </h3>
              <p className="text-sm text-orange-800 leading-relaxed">{challenge.reward}</p>
            </div>
          )}

          {/* 奖金展示 */}
          {challenge.rewardAmount > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-6 rounded-2xl border border-amber-200/60">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <span>💰</span> 奖金池
              </h3>
              <p className="text-2xl font-bold text-amber-600">¥{challenge.rewardAmount.toLocaleString()}</p>
              <p className="text-xs text-amber-700 mt-1">
                {challenge.rewardType === 'ALL' && '奖金 + 证书 + 面试机会'}
                {challenge.rewardType === 'BONUS' && '仅奖金'}
                {challenge.rewardType === 'CERTIFICATE' && '仅证书'}
              </p>
            </div>
          )}

          {/* 报名卡片 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-slate-900">{challenge.applicantCount}</p>
              <p className="text-sm text-slate-500">
                {challenge.spots ? `已报名 / 共 ${challenge.spots} 名额` : '已报名人数'}
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-xl mb-4 text-sm text-center ${
                message.includes('成功') || message.includes('🎉')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {message}
              </div>
            )}

            {challenge.hasApplied ? (
              <div className="space-y-3">
                <div className="bg-green-50 text-green-700 py-2.5 rounded-xl text-center font-medium">
                  ✓ 已报名
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full py-2 text-sm text-slate-500 hover:text-red-500 transition"
                >
                  取消报名
                </button>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full bg-gradient-to-r from-green-900 to-green-950 text-white py-2.5 rounded-xl hover:from-green-800 hover:to-green-900 disabled:opacity-50 transition font-medium shadow-sm"
              >
                {applying ? '报名中...' : '立即报名'}
              </button>
            )}

            <p className="text-xs text-slate-400 text-center mt-4">
              报名后企业可查看你的能力名片
            </p>
          </div>
        </div>
      </div>

      {/* 返回链接 */}
      <div className="mt-8">
        <Link href="/challenges" className="text-green-600 hover:text-green-700 font-medium text-sm">
          ← 返回挑战广场
        </Link>
      </div>
    </div>
  );
}