'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { isValidUrl } from '@/lib/sanitize';

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
  const { status, data: session } = useSession();
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
  const [related, setRelated] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/challenges/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('加载失败');
        return res.json();
      })
      .then((data) => {
        setChallenge(data);
        // 同分类推荐（排除当前挑战）
        const params2 = new URLSearchParams({
          category: data.category,
          pageSize: '4',
          sort: 'newest',
        });
        return fetch(`/api/challenges?${params2.toString()}`)
          .then((r) => (r.ok ? r.json() : { challenges: [] }))
          .then((relData) => {
            const list = (relData.challenges || []).filter(
              (c: any) => c.id !== data.id && c.status === 'OPEN'
            ).slice(0, 3);
            setRelated(list);
          });
      })
      .catch((err) => {
        console.error('Failed to load challenge:', err);
      })
      .finally(() => setLoading(false));

    if (status === 'authenticated') {
      fetch(`/api/challenges/${params.id}/submit`)
        .then((res) => res.json())
        .then(setSubmission)
        .catch((err) => {
          console.error('Failed to load submission:', err);
        });

      fetch(`/api/user/favorites?challengeId=${params.id}`)
        .then((res) => res.ok ? res.json() : { isFavorited: false })
        .then((data) => setIsFavorited(data.isFavorited || false))
        .catch((err) => {
          console.error('Failed to load favorite status:', err);
        });
    }
  }, [params.id, status]);

  const toggleFavorite = async () => {
    if (status !== 'authenticated') {
      router.push('/auth/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch('/api/user/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: params.id }),
      });
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级：使用 textarea
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-[#5D7A57] rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">加载中...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">挑战不存在</p>
        <Link href="/challenges" className="text-[#4A6B43] hover:underline mt-4 inline-block">
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
  ];

  const radarData = abilityRequirements.map((item) => ({
    subject: item.label,
    fullMark: 100,
    requirement: item.value,
    current: 0,
  }));

  const hasRequirements = abilityRequirements.some((item) => item.value > 0);

  const statusLabels: Record<string, string> = {
    PENDING: '待评审',
    REVIEWED: '已评审',
    APPROVED: '✅ 通过',
    REJECTED: '❌ 未通过',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    REVIEWED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-[#EDF3EB] text-[#7A9A75]',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/20 text-white`}>
              {categoryIcons[challenge.category]} {categoryLabels[challenge.category]}
            </span>
            <span className="text-[#D6E4D2]/70 text-sm">{challenge.company}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">{challenge.title}</h1>

          <div className="flex items-center gap-6 text-sm text-[#D6E4D2]/70">
            <span>👥 {challenge.applicantCount}/{challenge.spots || '∞'} 人已报名</span>
            {challenge.deadline && (
              <span>⏰ 截止 {new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
            )}
          </div>

          <button
            onClick={handleCopyLink}
            className="absolute top-6 right-6 z-20 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            {copied ? '✓ 已复制' : '🔗 分享'}
          </button>

          {session && (
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`absolute top-6 right-24 z-20 backdrop-blur-sm text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                isFavorited
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {isFavorited ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 左侧：详情 */}
        <div className="md:col-span-2 space-y-6">
          {/* 挑战描述 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#EDF3EB] rounded-lg flex items-center justify-center text-[#4A6B43] text-sm">📋</span>
              挑战详情
            </h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {challenge.description}
            </p>
          </div>

          {/* 能力要求 */}
          {hasRequirements && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm">⬡</span>
                能力要求
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Radar
                        name="要求"
                        dataKey="requirement"
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {abilityRequirements.map((item) => (
                    <div key={item.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-2xl mb-1">{item.icon}</p>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="text-xl font-bold text-orange-600">≥ {item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                💡 完成挑战后，对应能力维度会获得额外加分
              </p>
            </div>
          )}

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
                    {submission.solutionUrl && isValidUrl(submission.solutionUrl) && (
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
                    <div className="bg-[#F7FAF6] p-4 rounded-xl border border-[#EDF3EB]">
                      <p className="text-sm font-medium text-[#7A9A75] mb-1">💬 企业评语</p>
                      <p className="text-sm text-[#4A6B43]">{submission.reviewComment}</p>
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
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-[#5D7A57] outline-none transition"
                      placeholder="给你的作品起个名字"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">方案描述</label>
                    <textarea
                      value={submitForm.description}
                      onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-[#5D7A57] outline-none transition resize-none"
                      placeholder="详细描述你的解决方案...&#10;&#10;建议包含：&#10;- 你是如何理解这个问题的&#10;- 你的解决思路和方法&#10;- 关键技术点或创新点&#10;- 遇到的困难及解决过程"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">解决方案链接（选填）</label>
                    <input
                      type="url"
                      value={submitForm.solutionUrl}
                      onChange={(e) => setSubmitForm({ ...submitForm, solutionUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-[#5D7A57] outline-none transition"
                      placeholder="GitHub、线上演示地址等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">附件链接（选填）</label>
                    <input
                      type="text"
                      value={submitForm.attachments}
                      onChange={(e) => setSubmitForm({ ...submitForm, attachments: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5D7A57] focus:border-[#5D7A57] outline-none transition"
                      placeholder="PDF、PPT、视频等链接，用逗号分隔"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      className="flex-1 bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm"
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
                {challenge.rewardType === 'CASH' && '现金奖励'}
                {challenge.rewardType === 'PRIZE' && '实物奖品'}
                {challenge.rewardType === 'INTERNSHIP' && '实习机会'}
              </p>
            </div>
          )}

          {/* 企业信息 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#EDF3EB] rounded-lg flex items-center justify-center text-[#4A6B43] text-sm">🏢</span>
              发布企业
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#EDF3EB] flex items-center justify-center text-[#6B4E3D] font-bold">
                {challenge.company?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{challenge.company}</p>
                <p className="text-xs text-slate-500">{categoryLabels[challenge.category]}类挑战</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">挑战状态</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  challenge.status === 'OPEN' ? 'bg-[#EDF3EB] text-[#7A9A75]' :
                  challenge.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {challenge.status === 'OPEN' ? '进行中' :
                   challenge.status === 'CLOSED' ? '已关闭' : '已完成'}
                </span>
              </div>
              {challenge.deadline && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">报名截止</span>
                  <span className="text-slate-900">{new Date(challenge.deadline).toLocaleDateString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>

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
                  ? 'bg-[#F7FAF6] text-[#7A9A75]'
                  : 'bg-red-50 text-red-600'
              }`}>
                {message}
              </div>
            )}

            {challenge.hasApplied ? (
              <div className="space-y-3">
                <div className="bg-[#F7FAF6] text-[#7A9A75] py-2.5 rounded-xl text-center font-medium">
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
                className="w-full bg-gradient-to-r from-[#4A3728] to-[#2C1F14] text-white py-2.5 rounded-xl hover:from-[#6B4E3D] hover:to-[#4A3728] disabled:opacity-50 transition font-medium shadow-sm"
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

      {/* 相关推荐 */}
      {related.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">相关推荐</h2>
            <Link href={`/challenges?category=${challenge.category}`} className="text-sm text-[#4A6B43] hover:text-[#7A9A75]">
              查看更多 →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((c) => (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#D6E4D2] hover:shadow-md transition group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#EDF3EB] text-[#7A9A75]">
                    {categoryLabels[c.category] || c.category}
                  </span>
                  {c.rewardAmount > 0 && (
                    <span className="text-xs text-amber-600 font-medium">
                      ¥{(c.rewardAmount / 100).toFixed(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-[#7A9A75] transition line-clamp-2 mb-2">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500">{c.company}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  <span>👥 {c.applicantCount || 0} 报名</span>
                  {c.deadline && (
                    <span>⏰ {new Date(c.deadline).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 返回链接 */}
      <div className="mt-8">
        <Link href="/challenges" className="text-[#4A6B43] hover:text-[#7A9A75] font-medium text-sm">
          ← 返回挑战广场
        </Link>
      </div>
    </div>
  );
}