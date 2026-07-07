'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AbilityRadarChart from '@/components/AbilityRadarChart';

const projectTypeOptions = [
  { value: 'COURSE', label: '课程作业', icon: '📚', desc: '课堂项目、大作业、课程设计' },
  { value: 'COMPETITION', label: '比赛', icon: '🏆', desc: '黑客松、竞赛、创新创业' },
  { value: 'INTERNSHIP', label: '实习', icon: '💼', desc: '公司实习、兼职项目' },
  { value: 'PERSONAL', label: '个人项目', icon: '🚀', desc: 'Side Project、开源、自学项目' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<any>(null);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleQuickSubmit = async () => {
    if (selectedTypes.length === 0) return;
    setLoading(true);

    try {
      // 为每个选中的类型快速创建一个项目
      const typeLabels: Record<string, string> = {
        COURSE: '课程项目',
        COMPETITION: '比赛项目',
        INTERNSHIP: '实习项目',
        PERSONAL: '个人项目',
      };

      for (const type of selectedTypes) {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: quickTitle || `${typeLabels[type]} - 初始记录`,
            type,
            role: '',
            teamSize: 1,
            startDate: new Date().toISOString().split('T')[0],
            description: '快速初始化记录',
            difficulty: '',
            difficultyEncountered: '',
            solution: '',
            outcomeType: '',
            outcome: '',
            techStack: '[]',
            links: '[]',
          }),
        });
      }

      // 获取更新后的能力分数
      const scoreRes = await fetch('/api/ability');
      const scoreData = await scoreRes.json();
      setScores(scoreData.score);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const skipToDashboard = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') return null;

  const defaultScores = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {step === 1 && (
          <div className="bg-white p-8 rounded-xl border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              快速开始 🚀
            </h1>
            <p className="text-slate-500 mb-8">
              选一个你最想记录的项目类型，30秒生成你的能力名片。
            </p>

            {/* 快速输入 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                给第一个项目起个名字（可选）
              </label>
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="如：电商网站开发、数学建模比赛..."
              />
            </div>

            {/* 项目类型选择 */}
            <div className="mb-8">
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                你做过哪些类型的项目？（可多选）
              </label>
              <div className="grid grid-cols-2 gap-3">
                {projectTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleType(option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selectedTypes.includes(option.value)
                        ? 'border-slate-800 bg-slate-50'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{option.icon}</span>
                    <p className="font-medium text-slate-900 text-sm">{option.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleQuickSubmit}
                disabled={selectedTypes.length === 0 || loading}
                className="flex-1 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 transition font-medium"
              >
                {loading ? '生成中...' : `生成能力名片${selectedTypes.length > 0 ? ` (${selectedTypes.length}项)` : ''}`}
              </button>
              <button
                onClick={skipToDashboard}
                className="px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm"
              >
                跳过
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-xl border border-slate-100 text-center">
            <div className="mb-6">
              <span className="text-4xl">🎉</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
                你的能力名片已生成！
              </h1>
              <p className="text-slate-500">
                综合得分：<span className="text-amber-600 font-bold text-xl">{scores?.totalScore || 30}</span>
              </p>
            </div>

            {/* 雷达图预览 */}
            <div className="w-56 h-56 mx-auto mb-6">
              <AbilityRadarChart scores={scores || defaultScores} />
            </div>

            {/* 六维分数 */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              {[
                { label: '专业力', value: scores?.craft || 30 },
                { label: '学习力', value: scores?.learn || 30 },
                { label: '自驱力', value: scores?.drive || 30 },
                { label: '协作力', value: scores?.team || 30 },
                { label: '抗压力', value: scores?.grit || 30 },
                { label: '表达力', value: scores?.express || 30 },
              ].map((item) => (
                <div key={item.label} className="py-2 bg-slate-50 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-green-900 text-white rounded-lg hover:bg-green-800 transition font-medium"
              >
                进入仪表盘 →
              </button>
              <button
                onClick={() => router.push('/projects/new')}
                className="w-full py-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
              >
                详细记录第一个项目
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
