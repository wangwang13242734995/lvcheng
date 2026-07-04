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
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (!data?.user) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">用户不存在</p></div>;
  }

  const { user, score, projects, growthRecords } = data;
  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };
  const scores = score || defaultScores;
  const skills: string[] = user.skills ? JSON.parse(user.skills) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl text-indigo-600 font-bold">
            {user.name?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">
              {[user.school, user.major, user.graduationYear ? `${user.graduationYear}届` : ''].filter(Boolean).join(' · ') || '未设置个人信息'}
            </p>
            {user.bio && <p className="text-gray-500 mt-1">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white p-6 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-4">六维能力</h2>
        <AbilityRadarChart scores={scores} />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
          {[
            { label: '专业力', value: scores.craft },
            { label: '学习力', value: scores.learn },
            { label: '自驱力', value: scores.drive },
            { label: '协作力', value: scores.team },
            { label: '抗压力', value: scores.grit },
            { label: '表达力', value: scores.express },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-indigo-600">{projects?.length || 0}</p>
          <p className="text-sm text-gray-500">代表项目</p>
        </div>
        <div className="bg-white p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-600">{growthRecords?.length || 0}</p>
          <p className="text-sm text-gray-500">成长记录</p>
        </div>
        <div className="bg-white p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-purple-600">{skills.length || 0}</p>
          <p className="text-sm text-gray-500">技能标签</p>
        </div>
        <div className="bg-white p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-orange-600">{scores.totalScore || 30}</p>
          <p className="text-sm text-gray-500">综合得分</p>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold mb-3">技能标签</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Featured Projects */}
      {projects && projects.length > 0 && (
        <div className="bg-white p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold mb-4">代表项目</h2>
          <div className="space-y-4">
            {projects.slice(0, 3).map((project: any) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{project.title}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                    {typeLabels[project.type] || project.type}
                  </span>
                  {project.outcomeType && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                      ✓ 可信
                    </span>
                  )}
                </div>
                {project.difficultyEncountered && (
                  <p className="text-sm text-gray-600">
                    <strong>困难：</strong>{project.difficultyEncountered}
                  </p>
                )}
                {project.solution && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>解决：</strong>{project.solution}
                  </p>
                )}
                {project.outcome && (
                  <p className="text-sm text-green-600 mt-1">
                    <strong>成果：</strong>{project.outcome}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Timeline */}
      {growthRecords && growthRecords.length > 0 && (
        <div className="bg-white p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">成长时间线</h2>
          <div className="relative pl-6 border-l-2 border-indigo-200 space-y-4">
            {growthRecords.slice(0, 10).map((record: any) => (
              <div key={record.id} className="relative">
                <div className="absolute -left-[25px] w-4 h-4 bg-indigo-400 rounded-full border-2 border-white" />
                <div>
                  <p className="font-medium text-gray-900">{record.title}</p>
                  {record.content && (
                    <p className="text-sm text-gray-600 mt-1">{record.content}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
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
