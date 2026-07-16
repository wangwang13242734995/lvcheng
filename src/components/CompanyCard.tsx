'use client';

interface CompanyCardProps {
  name: string;
  challengeCount: number;
  totalReward: number;
}

export default function CompanyCard({ name, challengeCount, totalReward }: CompanyCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          🏢
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">{challengeCount} 个挑战</p>
        </div>
      </div>
      {totalReward > 0 && (
        <div className="bg-blue-50/50 rounded-lg px-3 py-2 text-center">
          <span className="text-xs text-blue-600">累计奖金池</span>
          <span className="text-sm font-bold text-blue-700 ml-1">
            ¥{(totalReward / 1000).toFixed(0)}k
          </span>
        </div>
      )}
    </div>
  );
}