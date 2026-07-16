'use client';

import { useState, useEffect } from 'react';
import { checkScoreAchievements, checkProjectMilestones, getAchievementStats } from '@/services/achievement-engine';
import { ABILITY_BASE_SCORE } from '@/lib/ability-constants';

interface AchievementPanelProps {
  scores: Record<string, number>;
  projectCount: number;
}

export default function AchievementPanel({ scores, projectCount }: AchievementPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = getAchievementStats(scores, projectCount);
  const scoreAchievements = checkScoreAchievements(scores);
  const projectMilestones = checkProjectMilestones(projectCount);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* 头部 - 始终显示 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 text-sm">成就进度</h3>
            <p className="text-xs text-slate-500">
              已解锁 {stats.unlocked}/{stats.total} 个成就
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 进度条 */}
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-50">
          {/* 分数成就 */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">能力里程碑</h4>
            <div className="grid grid-cols-3 gap-2">
              {scoreAchievements.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg text-center transition ${
                    a.achieved ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 opacity-50'
                  }`}
                >
                  <span className="text-lg">{a.icon}</span>
                  <p className={`text-xs font-medium mt-1 ${a.achieved ? 'text-amber-700' : 'text-slate-400'}`}>
                    {a.title}
                  </p>
                  {!a.achieved && (
                    <p className="text-xs text-slate-400 mt-0.5">差{a.threshold - (scores[a.id.split('_')[0]] || ABILITY_BASE_SCORE)}分</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 项目成就 */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">项目里程碑</h4>
            <div className="flex gap-2">
              {projectMilestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex-1 p-2 rounded-lg text-center transition ${
                    m.achieved ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 opacity-50'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <p className={`text-xs font-medium mt-1 ${m.achieved ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {m.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 成就触发弹窗
interface AchievementToastProps {
  achievements: { title: string; icon: string; description: string }[];
  onClose: () => void;
}

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (achievements.length === 0) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{achievements[0].icon}</span>
          <div>
            <p className="text-xs text-amber-600 font-medium">🎉 新成就解锁！</p>
            <p className="font-semibold text-slate-900 text-sm">{achievements[0].title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{achievements[0].description}</p>
            {achievements.length > 1 && (
              <p className="text-xs text-amber-600 mt-1">还有 {achievements.length - 1} 个成就达成</p>
            )}
          </div>
          <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-slate-300 hover:text-slate-500 text-lg">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
