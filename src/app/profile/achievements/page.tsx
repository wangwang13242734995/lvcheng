'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Badge {
  id: string;
  name: string;
  description: string;
  level: string;
  icon: string;
  challengeId: string | null;
  company: string | null;
  earnedAt: string;
}

interface Certificate {
  id: string;
  title: string;
  description: string;
  issuer: string;
  issuerLogo: string | null;
  craftScore: number;
  learnScore: number;
  driveScore: number;
  teamScore: number;
  gritScore: number;
  expressScore: number;
  challengeId: string | null;
  issuedAt: string;
}

interface Stats {
  totalBadges: number;
  totalCertificates: number;
  levelStats: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    DIAMOND: number;
  };
}

const levelColors: Record<string, string> = {
  BRONZE: 'from-amber-700 to-amber-900',
  SILVER: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-amber-600',
  DIAMOND: 'from-cyan-300 to-blue-500',
};

const levelBorderColors: Record<string, string> = {
  BRONZE: 'border-amber-700',
  SILVER: 'border-slate-400',
  GOLD: 'border-yellow-400',
  DIAMOND: 'border-cyan-400',
};

const levelLabels: Record<string, string> = {
  BRONZE: '青铜',
  SILVER: '白银',
  GOLD: '黄金',
  DIAMOND: '钻石',
};

type TabType = 'badges' | 'certificates';

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('badges');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/achievements');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setBadges(data.badges);
      setCertificates(data.certificates);
      setStats(data.stats);
    } catch (err) {
      setError('加载成就数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">我的成就</h1>
            <p className="text-slate-500 mt-1">展示你获得的徽章和证书</p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← 返回个人资料
          </Link>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm md:col-span-2">
              <p className="text-3xl font-bold text-slate-900">
                {stats.totalBadges + stats.totalCertificates}
              </p>
              <p className="text-sm text-slate-500 mt-1">总成就数</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-3xl font-bold text-amber-700">{stats.levelStats.BRONZE}</p>
              <p className="text-xs text-slate-500 mt-1">🥉 青铜</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-3xl font-bold text-slate-500">{stats.levelStats.SILVER}</p>
              <p className="text-xs text-slate-500 mt-1">🥈 白银</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-3xl font-bold text-yellow-500">{stats.levelStats.GOLD}</p>
              <p className="text-xs text-slate-500 mt-1">🥇 黄金</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-3xl font-bold text-cyan-500">{stats.levelStats.DIAMOND}</p>
              <p className="text-xs text-slate-500 mt-1">💎 钻石</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === 'badges'
                  ? 'text-[#6B4E3D] border-b-2 border-[#6B4E3D] bg-[#F7FAF6]/30'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🏅 徽章 ({stats?.totalBadges || 0})
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === 'certificates'
                  ? 'text-[#6B4E3D] border-b-2 border-[#6B4E3D] bg-[#F7FAF6]/30'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📜 证书 ({stats?.totalCertificates || 0})
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-3">{error}</p>
                <button
                  onClick={fetchData}
                  className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
                >
                  重试
                </button>
              </div>
            ) : activeTab === 'badges' ? (
              badges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-3">🏅</p>
                  <p className="text-slate-500">还没有获得徽章</p>
                  <Link
                    href="/challenges"
                    className="inline-block mt-4 text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
                  >
                    去挑战 → 获取徽章
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`bg-white border-2 ${levelBorderColors[badge.level] || 'border-slate-200'} rounded-2xl p-5 shadow-sm hover:shadow-md transition`}
                    >
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${levelColors[badge.level] || 'from-slate-400 to-slate-600'} flex items-center justify-center text-3xl shadow-md mb-3`}>
                        {badge.icon}
                      </div>
                      <p className="text-center font-semibold text-slate-900">{badge.name}</p>
                      <p className="text-xs text-center text-slate-500 mt-1">
                        {levelLabels[badge.level] || badge.level} 等级
                      </p>
                      <p className="text-xs text-center text-slate-400 mt-2 line-clamp-2">
                        {badge.description}
                      </p>
                      {badge.company && (
                        <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                          {badge.company}
                        </p>
                      )}
                      <p className="text-xs text-center text-slate-400 mt-3 pt-3 border-t border-slate-100">
                        获得于 {new Date(badge.earnedAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : certificates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-3">📜</p>
                <p className="text-slate-500">还没有获得证书</p>
                <Link
                  href="/challenges"
                  className="inline-block mt-4 text-sm text-[#7A9A75] hover:text-[#6B4E3D]"
                >
                  去挑战 → 获取证书
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className="bg-gradient-to-br from-[#F7FAF6] to-emerald-50 border-2 border-[#D6E4D2] rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7A9A75] to-[#4A3728] flex items-center justify-center text-white text-xl shadow-md">
                        📜
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#EDF3EB] text-[#7A9A75] font-medium">
                        完成证书
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{cert.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">
                      颁发方: <span className="font-medium text-slate-700">{cert.issuer}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      颁发于 {new Date(cert.issuedAt).toLocaleDateString('zh-CN')}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#D6E4D2]/50 flex items-center justify-between text-xs">
                      <span className="text-slate-500">六维能力综合分</span>
                      <span className="font-bold text-[#7A9A75]">
                        {Math.round((cert.craftScore + cert.learnScore + cert.driveScore + cert.teamScore + cert.gritScore + cert.expressScore) / 6)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#6B4E3D] to-[#2C1F14] p-6 text-center relative">
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                ✕
              </button>
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center text-4xl mb-3">
                📜
              </div>
              <h2 className="text-2xl font-bold text-white">完成证书</h2>
              <p className="text-[#D6E4D2] text-sm mt-1">{selectedCert.issuer}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">{selectedCert.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{selectedCert.description}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">六维能力评分</p>
                <div className="space-y-2">
                  {[
                    { label: '专业力', value: selectedCert.craftScore, color: 'bg-blue-500' },
                    { label: '学习力', value: selectedCert.learnScore, color: 'bg-[#5D7A57]' },
                    { label: '自驱力', value: selectedCert.driveScore, color: 'bg-yellow-500' },
                    { label: '协作力', value: selectedCert.teamScore, color: 'bg-purple-500' },
                    { label: '抗压力', value: selectedCert.gritScore, color: 'bg-red-500' },
                    { label: '表达力', value: selectedCert.expressScore, color: 'bg-pink-500' },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16">{dim.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${dim.color} transition-all`}
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8 text-right">{dim.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400">
                  颁发于 {new Date(selectedCert.issuedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
