'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AbilityRadarChart from '@/components/AbilityRadarChart';

const typeLabels: Record<string, string> = {
  COURSE: '课程作业',
  COMPETITION: '比赛',
  INTERNSHIP: '实习',
  PERSONAL: '个人项目',
  CHALLENGE: '挑战赛',
};

const typeIcons: Record<string, string> = {
  COURSE: '📚',
  COMPETITION: '🏆',
  INTERNSHIP: '💼',
  PERSONAL: '🛠',
  CHALLENGE: '⚔️',
};

const typeColors: Record<string, string> = {
  COURSE: 'bg-blue-100 text-blue-700',
  COMPETITION: 'bg-amber-100 text-amber-700',
  INTERNSHIP: 'bg-emerald-100 text-emerald-700',
  PERSONAL: 'bg-violet-100 text-violet-700',
  CHALLENGE: 'bg-rose-100 text-rose-700',
};

export default function ProfilePage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ability?userId=${params.userId}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.userId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-green-500 rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">加载中...</p>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">用户不存在</p>
      </div>
    );
  }

  const { user, score, projects, growthRecords } = data;
  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };
  const scores = score || defaultScores;
  const skills: string[] = user.skills ? JSON.parse(user.skills) : [];

  const abilityItems = [
    { label: '专业力', value: scores.craft, icon: '🛠', color: 'from-green-500 to-green-600' },
    { label: '学习力', value: scores.learn, icon: '📚', color: 'from-blue-500 to-blue-600' },
    { label: '自驱力', value: scores.drive, icon: '⚡', color: 'from-amber-500 to-amber-600' },
    { label: '协作力', value: scores.team, icon: '🤝', color: 'from-purple-500 to-purple-600' },
    { label: '抗压力', value: scores.grit, icon: '🏔', color: 'from-rose-500 to-rose-600' },
    { label: '表达力', value: scores.express, icon: '🎯', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-8 mb-6 relative overflow-hidden">
        {/* 装饰 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl text-white font-bold border border-white/20">
            {user.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-orange-400">{scores.totalScore || 30}</span>
              <span className="text-green-200/70 text-sm">综合得分</span>
              {projects?.length > 0 && (
                <>
                  <span className="text-green-500/50">|</span>
                  <span className="text-sm text-green-200/70">{projects.length} 个项目</span>
                </>
              )}
              {growthRecords?.length > 0 && (
                <>
                  <span className="text-green-500/50">|</span>
                  <span className="text-sm text-green-200/70">{growthRecords.length} 条成长记录</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 六维能力 - 核心展示 */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">⬡</span>
          六维能力
        </h2>
        <AbilityRadarChart scores={scores} />

        {/* 能力分数网格 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6">
          {abilityItems.map((item) => (
            <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.icon} {item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 text-sm">🏷</span>
            技能标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="bg-gradient-to-r from-green-50 to-green-100/50 text-green-800 px-3 py-1.5 rounded-full text-sm border border-green-200/60 font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Featured Projects - 影响力优先 */}
      {projects && projects.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm">🏆</span>
            代表项目
          </h2>
          <div className="space-y-4">
            {projects.slice(0, 3).map((project: any) => (
              <div key={project.id} className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{typeIcons[project.type] || '📁'}</span>
                  <h3 className="font-semibold text-slate-900">{project.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[project.type] || 'bg-slate-100 text-slate-600'}`}>
                    {typeLabels[project.type] || project.type}
                  </span>
                  {project.outcomeType && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      ✓ 已验证
                    </span>
                  )}
                </div>
                {project.outcome && (
                  <p className="text-sm text-orange-700 font-medium mb-2 bg-orange-50/50 px-3 py-1.5 rounded-lg inline-block">
                    📊 {project.outcome}
                  </p>
                )}
                {project.difficultyEncountered && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">挑战：</span>{project.difficultyEncountered}
                  </p>
                )}
                {project.solution && (
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-medium text-green-700">解决：</span>{project.solution}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Timeline */}
      {growthRecords && growthRecords.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">📈</span>
            成长时间线
          </h2>
          <div className="relative pl-6 border-l-2 border-green-200 space-y-5">
            {growthRecords.slice(0, 10).map((record: any) => (
              <div key={record.id} className="relative">
                <div className="absolute -left-[25px] w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-medium text-slate-900">{record.title}</p>
                  {record.content && (
                    <p className="text-sm text-slate-500 mt-1">{record.content}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
