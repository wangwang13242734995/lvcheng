'use client';

import Link from 'next/link';

interface ChallengeCardProps {
  id: string;
  company: string;
  title: string;
  description: string;
  category: string;
  reward: string | null;
  rewardAmount: number;
  applicantCount: number;
  hasApplied?: boolean;
}

export default function ChallengeCard({
  id,
  company,
  title,
  description,
  reward,
  rewardAmount,
  applicantCount,
  hasApplied = false,
}: ChallengeCardProps) {
  return (
    <Link
      key={id}
      href={`/challenges/${id}`}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">🏢</div>
        <span className="text-[#D6E4D2]/80 text-sm">{company}</span>
      </div>
      <h3 className="font-semibold text-white mb-2 group-hover:text-orange-300 transition">
        {title}
      </h3>
      <p className="text-[#D6E4D2]/60 text-sm line-clamp-2 mb-3">
        {description}
      </p>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {rewardAmount > 0 && (
            <span className="text-orange-400 font-medium">¥{rewardAmount.toLocaleString()}</span>
          )}
          {reward && (
            <span className="text-[#D6E4D2]/60 text-xs">{reward}</span>
          )}
        </div>
        <span className="text-[#D6E4D2]/60">{applicantCount} 人已报名</span>
      </div>
    </Link>
  );
}