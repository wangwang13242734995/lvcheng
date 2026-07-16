'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

interface Dimension {
  key: DimensionKey;
  label: string;
  icon: string;
  description: string;
}

interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

interface TrendDataPoint {
  date: string;
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  total: number;
}

interface Suggestion {
  dimension: string;
  icon: string;
  currentValue: number;
  description: string;
}

interface AbilityData {
  radar: RadarDataPoint[];
  trend: TrendDataPoint[];
  latest: { totalScore: number; calculatedAt: string; craft: number; learn: number; drive: number; team: number; grit: number; express: number } | null;
  dimensions: Dimension[];
  completedChallenges: number;
  suggestions: Suggestion[];
}

type DimensionKey = 'craft' | 'learn' | 'drive' | 'team' | 'grit' | 'express';

const DIMENSION_COLORS: Record<DimensionKey, string> = {
  craft: '#3b82f6',
  learn: '#10b981',
  drive: '#eab308',
  team: '#a855f7',
  grit: '#ef4444',
  express: '#ec4899',
};

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

// 维度能力描述：不同分数段代表的能力水平
const DIMENSION_ABILITY_DESCRIPTIONS: Record<DimensionKey, Record<string, string>> = {
  craft: {
    '90+': '能独立完成复杂全栈项目，技术选型合理，代码质量高',
    '80-89': '能独立完成中等复杂度项目，掌握多种技术栈',
    '60-79': '能完成基础项目，有一定技术深度',
    '40-59': '有基础编程能力，项目经验较少',
    '10-39': '刚入门，需要更多实践',
  },
  learn: {
    '90+': '快速掌握新技术，跨领域能力强，持续学习能力强',
    '80-89': '能较快学习新技术，有一定跨领域能力',
    '60-79': '学习态度积极，技术广度有待提升',
    '40-59': '有学习意愿，需要更多探索',
    '10-39': '刚起步，建议多尝试不同领域',
  },
  drive: {
    '90+': '高度自驱，主动探索新技术，持续产出个人项目',
    '80-89': '有较强自驱力，能主动学习和实践',
    '60-79': '有一定主动性，需要更多自我驱动',
    '40-59': '依赖外部驱动，建议设定个人目标',
    '10-39': '起步阶段，建议设定小目标并坚持',
  },
  team: {
    '90+': '多次担任团队核心角色，协作能力强，沟通高效',
    '80-89': '有团队协作经验，能胜任多种角色',
    '60-79': '有团队协作基础，角色经验较少',
    '40-59': '团队经验有限，建议多参与团队项目',
    '10-39': '缺乏团队协作经验，建议主动参与',
  },
  grit: {
    '90+': '能克服复杂困难，项目完成率高，抗压能力强',
    '80-89': '有一定抗压能力，能解决中等难度问题',
    '60-79': '有解决问题意识，需要更多挑战',
    '40-59': '遇到困难容易放弃，建议多记录解决过程',
    '10-39': '需要培养解决问题的韧性',
  },
  express: {
    '90+': '表达清晰，文档完善，有视频展示，沟通能力强',
    '80-89': '项目描述清晰，有一定展示能力',
    '60-79': '有表达意识，展示质量有待提升',
    '40-59': '项目描述简单，建议完善文档',
    '10-39': '缺乏展示意识，建议完善项目描述',
  },
};

// 维度提升路径
const DIMENSION_IMPROVEMENT_PATHS: Record<DimensionKey, string[]> = {
  craft: ['发布更多完整项目', '标注技术栈', '记录量化成果', '标注项目难度'],
  learn: ['尝试不同类型项目', '记录新技能学习', '学习新技术栈'],
  drive: ['发布个人项目', '参与挑战', '持续记录成长'],
  team: ['参与团队项目', '尝试不同角色', '记录协作经验'],
  grit: ['记录困难与解决方案', '完成长周期项目', '挑战高难度任务'],
  express: ['完善项目描述（300字+）', '添加演示视频', '上传截图/附件'],
};

export default function AbilityPage() {
  const [data, setData] = useState<AbilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/ability-radar');
      if (!res.ok) throw new Error('加载失败');
      const result: AbilityData = await res.json();
      setData(result);
    } catch (err) {
      setError('加载能力数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'text-[#4A6B43]', bg: 'bg-[#EDF3EB]', emoji: '🌟' };
    if (score >= 60) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-100', emoji: '👍' };
    if (score >= 40) return { label: '一般', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '📈' };
    if (score > 10) return { label: '待提升', color: 'text-red-600', bg: 'bg-red-100', emoji: '💪' };
    return { label: '起步', color: 'text-slate-500', bg: 'bg-slate-100', emoji: '🌱' };
  };

  const getAbilityDescription = (dim: DimensionKey, score: number): string => {
    const descriptions = DIMENSION_ABILITY_DESCRIPTIONS[dim];
    if (score >= 90) return descriptions['90+'];
    if (score >= 80) return descriptions['80-89'];
    if (score >= 60) return descriptions['60-79'];
    if (score >= 40) return descriptions['40-59'];
    return descriptions['10-39'];
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return { value: 0, label: '新', positive: true };
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    if (diff > 0) return { value: diff, percent, label: `+${diff}`, positive: true };
    if (diff < 0) return { value: diff, percent, label: `${diff}`, positive: false };
    return { value: 0, percent: '0', label: '持平', positive: false };
  };

  const getTopDimension = () => {
    if (!data?.latest) return null;
    const dims: DimensionKey[] = ['craft', 'learn', 'drive', 'team', 'grit', 'express'];
    let top = dims[0];
    let max = data.latest[top];
    for (const dim of dims) {
      if (data.latest[dim] > max) {
        max = data.latest[dim];
        top = dim;
      }
    }
    return { key: top, label: DIMENSION_LABELS[top], value: max };
  };

  const getOverallLevel = () => {
    if (!data?.latest) return { label: '未评估', emoji: '📊' };
    const score = data.latest.totalScore;
    if (score >= 80) return { label: '能力出众', emoji: '🏆' };
    if (score >= 60) return { label: '能力扎实', emoji: '🎯' };
    if (score >= 40) return { label: '潜力可期', emoji: '💡' };
    return { label: '起步阶段', emoji: '🌱' };
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-[#D6E4D2] border-t-[#4A6B43] rounded-full animate-spin mb-4" />
          <p className="text-slate-400">正在计算能力值...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-red-500 mb-3">{error || '暂无数据'}</p>
          <button onClick={fetchData} className="text-sm text-[#7A9A75] hover:text-[#6B4E3D]">
            重试
          </button>
        </div>
      </div>
    );
  }

  const topDimension = getTopDimension();
  const overallLevel = getOverallLevel();
  const previousScore = data.trend.length > 1 ? data.trend[data.trend.length - 2] : null;
  const totalGrowth = data.latest && previousScore ? calculateGrowth(data.latest.totalScore, previousScore.total) : { value: 0, label: '新', positive: true };
  const dimValues: Record<DimensionKey, number> = data.latest ? {
    craft: data.latest.craft,
    learn: data.latest.learn,
    drive: data.latest.drive,
    team: data.latest.team,
    grit: data.latest.grit,
    express: data.latest.express,
  } : { craft: 0, learn: 0, drive: 0, team: 0, grit: 0, express: 0 };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">能力雷达</h1>
            <p className="text-slate-500 mt-1">六维能力评估与成长轨迹</p>
          </div>
          <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-700 transition">
            ← 返回个人资料
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#7A9A75] to-[#4A3728] rounded-2xl p-5 text-white shadow-lg">
            <p className="text-[#D6E4D2] text-xs mb-1">综合能力分</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{data.latest?.totalScore || 0}</p>
              {totalGrowth.value !== 0 && (
                <span className={`text-sm ${totalGrowth.positive ? 'text-[#B3CEAD]' : 'text-red-300'}`}>
                  {totalGrowth.label}
                </span>
              )}
            </div>
            <p className="text-xs text-[#D6E4D2] mt-1">
              {data.latest ? `更新于 ${new Date(data.latest.calculatedAt).toLocaleDateString('zh-CN')}` : '尚无数据'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs mb-1">最高维度</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⬡</span>
              <div>
                <p className="text-xl font-bold text-slate-900">{topDimension?.label || '-'}</p>
                <p className="text-xs text-slate-400">{topDimension?.value || 0} 分</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs mb-1">已完成挑战</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <p className="text-xl font-bold text-slate-900">{data.completedChallenges}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">提交已通过</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-amber-100 text-xs mb-1">能力评级</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{overallLevel.emoji}</span>
              <p className="text-lg font-bold">{overallLevel.label}</p>
            </div>
          </div>
        </div>

        {/* Scoring Rules - Collapsible */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">📖</span>
              <span className="font-semibold text-slate-900">打分规则说明</span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showRules ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showRules && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="pt-4 space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">💡 核心理念</h4>
                  <p className="text-sm text-slate-600">
                    分数基于你的真实作品和行为自动计算，而非人工评分。平台核心理念是「用作品证明能力」。
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">📊 单项目评分（0-100）</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>完整度 25%</span>
                        <span className="text-slate-400">标题、描述、技术栈、附件</span>
                      </div>
                      <div className="flex justify-between">
                        <span>深度 30%</span>
                        <span className="text-slate-400">成果、量化数据、困难解决</span>
                      </div>
                      <div className="flex justify-between">
                        <span>展示 20%</span>
                        <span className="text-slate-400">视频、链接、截图</span>
                      </div>
                      <div className="flex justify-between">
                        <span>难度 25%</span>
                        <span className="text-slate-400">EASY→EXPERT 10→25分</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">⚡ 权重调整</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>时间衰减</span>
                        <span className="text-slate-400">近期项目权重更高</span>
                      </div>
                      <div className="flex justify-between">
                        <span>难度系数</span>
                        <span className="text-slate-400">EXPERT×2.0, HARD×1.5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>技术广度</span>
                        <span className="text-slate-400">对数增长，防堆砌</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">📈 分数增长曲线</h4>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1 h-3 bg-gradient-to-r from-[#D6E4D2] via-amber-200 to-red-200 rounded-full relative">
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-slate-700">
                        <span>10</span>
                        <span>40</span>
                        <span>60</span>
                        <span>80</span>
                        <span>95+</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    前快后慢：前2-3个高质量项目可快速涨到60分，涨到90分需要持续产出高质量作品。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Radar Chart & Dimension Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#EDF3EB] rounded-lg flex items-center justify-center text-[#4A6B43]">⬡</span>
              六维能力雷达
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.radar}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar
                    name="能力"
                    dataKey="value"
                    stroke="#15803d"
                    fill="url(#radarGradient)"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#15803d" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {data.radar.map((point) => (
                <div key={point.subject} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4A6B43]" />
                  <span className="text-xs text-slate-600">{point.subject}: {point.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📊</span>
              维度详情
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {data.dimensions.map((dim) => {
                const value = dimValues[dim.key as keyof typeof dimValues] || 0;
                const level = getScoreLevel(value);
                const prevValue = previousScore?.[dim.key as keyof TrendDataPoint] as number || 0;
                const growth = calculateGrowth(value, prevValue);
                const abilityDesc = getAbilityDescription(dim.key, value);
                const improvementPath = DIMENSION_IMPROVEMENT_PATHS[dim.key];

                return (
                  <div key={dim.key} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dim.icon}</span>
                        <p className="font-semibold text-slate-900">{dim.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.bg} ${level.color}`}>
                          {level.emoji} {level.label}
                        </span>
                        <span className="text-lg font-bold text-slate-700">{value}</span>
                        {growth.value !== 0 && (
                          <span className={`text-xs font-medium ${growth.positive ? 'text-[#4A6B43]' : 'text-red-500'}`}>
                            {growth.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${value}%`,
                            backgroundColor: DIMENSION_COLORS[dim.key] || '#64748b',
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{abilityDesc}</p>
                    {value < 80 && improvementPath.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {improvementPath.slice(0, 3).map((tip, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {tip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">📈</span>
            能力成长趋势
          </h2>
          {data.trend.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              暂无历史数据，完成项目后将显示成长趋势
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString('zh-CN')}
                    contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={DIMENSION_LABELS[key]}
                      stroke={DIMENSION_COLORS[key]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Comparison Bar Chart */}
        {data.trend.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">📊</span>
              近期变化对比
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend.slice(-5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString('zh-CN')}
                    contentStyle={{ fontSize: 12, borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={DIMENSION_LABELS[key]}
                      fill={DIMENSION_COLORS[key]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
              <span>💡</span> 提升建议
            </h2>
            <p className="text-sm text-amber-800 mb-4">
              以下维度还有提升空间，建议通过参与相关挑战来加强：
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {data.suggestions.map((s) => (
                <div key={s.dimension} className="bg-white/70 backdrop-blur rounded-lg p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-lg font-bold text-amber-700">{s.currentValue}</span>
                  </div>
                  <p className="font-medium text-slate-900 text-sm mb-1">{s.dimension}</p>
                  <p className="text-xs text-slate-500 flex-1">{s.description}</p>
                </div>
              ))}
            </div>
            <Link href="/challenges" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium">
              去挑战广场 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}