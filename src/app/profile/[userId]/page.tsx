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
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (!data?.user) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-slate-400">用户不存在</p></div>;
  }

  const { user, score, projects, growthRecords } = data;
  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };
  const scores = score || defaultScores;
  const skills: string[] = user.skills ? JSON.parse(user.skills) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header - 能力优先，学校弱化 */}
      <div className="bg-white p-8 rounded-xl border border-slate-100 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl text-white font-bold">
            {user.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-amber-600 font-bold text-xl">{scores.totalScore || 30}</span>
              <span className="text-xs text-slate-400">综合得分</span>
              {projects?.length > 0 && (
                <>
                  <span className="text-slate-200">|</span>
                  <span className="text-sm text-slate-500">{projects.length} 个项目</span>
                </>
              )}
              {growthRecords?.length > 0 && (
                <>
                  <span className="text-slate-200">|</span>
                  <span className="text-sm text-slate-500">{growthRecords.length} 条成长记录</span>
                </>
              )}
            </div>
            {/* 学校信息弱化处理 */}
            {(user.school || user.major) && (
              <p className="text-xs text-slate-400 mt-1">
                {[user.school, user.major, user.graduationYear ? `${user.graduationYear}届` : ''].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 六维能力 - 核心展示 */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">六维能力</h2>
        <AbilityRadarChart scores={scores} />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {[
            { label: '专业力', value: scores.craft },
            { label: '学习力', value: scores.learn },
            { label: '自驱力', value: scores.drive },
            { label: '协作力', value: scores.team },
            { label: '抗压力', value: scores.grit },
            { label: '表达力', value: scores.express },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xl font-bold text-amber-600">{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">技能标签</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Featured Projects - 影响力优先 */}
      {projects && projects.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">代表项目</h2>
          <div className="space-y-4">
            {projects.slice(0, 3).map((project: any) => (
              <div key={project.id} className="p-5 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900">{project.title}</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    {typeLabels[project.type] || project.type}
                  </span>
                  {project.outcomeType && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                      ✓ 已验证
                    </span>
                  )}
                </div>
                {project.outcome && (
                  <p className="text-sm text-amber-700 font-medium mb-2">
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
                    <span className="font-medium text-slate-700">解决：</span>{project.solution}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Timeline */}
      {growthRecords && growthRecords.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">成长时间线</h2>
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
            {growthRecords.slice(0, 10).map((record: any) => (
              <div key={record.id} className="relative">
                <div className="absolute -left-[25px] w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
                <div>
                  <p className="font-medium text-slate-900">{record.title}</p>
                  {record.content && (
                    <p className="text-sm text-slate-500 mt-1">{record.content}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
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
