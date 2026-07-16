'use client';

import Link from 'next/link';
import AbilityRadarChart from './AbilityRadarChart';

interface Scores {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore?: number;
}

interface TalentCardProps {
  id: string;
  name: string;
  avatar?: string | null;
  projectCount: number;
  scores: Scores;
  skills?: string[];
  bio?: string | null;
}

const skillLabels: Record<string, string> = {
  craft: '专业力',
  learn: '学习力',
  drive: '自驱力',
  team: '协作力',
  grit: '抗压力',
  express: '表达力',
};

const getTopSkill = (scores: Scores) => {
  const entries = Object.entries(scores).filter(([key]) => key !== 'totalScore');
  const max = entries.reduce((prev, curr) => (curr[1] as number) > (prev[1] as number) ? curr : prev);
  return { label: skillLabels[max[0]], value: max[1] };
};

export default function TalentCard({ id, name, projectCount, scores }: TalentCardProps) {
  const topSkill = getTopSkill(scores);

  return (
    <Link
      href={`/profile/${id}`}
      className="snap-start flex-shrink-0 w-72 bg-white rounded-2xl border border-slate-100 hover:border-[#D6E4D2] hover:shadow-lg transition-all group"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8AB382] to-[#4A6B43] flex items-center justify-center text-white font-semibold text-lg">
            {name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-400 truncate">
              新锐人才 · {projectCount} 个项目
            </p>
          </div>
        </div>

        <div className="h-36 md:h-40 mb-4">
          <AbilityRadarChart scores={scores} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-1 bg-[#F7FAF6] text-[#7A9A75] rounded-full font-medium">
              {topSkill.label}
            </span>
            <span className="text-sm font-bold text-[#4A6B43]">{topSkill.value}</span>
          </div>
          <span className="text-xs text-slate-400 group-hover:text-[#4A6B43] transition">
            查看名片 →
          </span>
        </div>
      </div>
    </Link>
  );
}