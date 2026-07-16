'use client';

import Link from 'next/link';

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
  PERSONAL: '🚀',
  CHALLENGE: '⚔️',
};

const typeColors: Record<string, string> = {
  COURSE: 'bg-blue-100 text-blue-700',
  COMPETITION: 'bg-amber-100 text-amber-700',
  INTERNSHIP: 'bg-emerald-100 text-emerald-700',
  PERSONAL: 'bg-violet-100 text-violet-700',
  CHALLENGE: 'bg-rose-100 text-rose-700',
};

interface ProjectCardProps {
  id: string;
  title: string;
  type: string;
  description: string | null;
  outcome: string | null;
  techStack: string[];
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  videoUrl?: string | null;
  status?: string;
}

export default function ProjectCard({
  id,
  title,
  type,
  description,
  outcome,
  techStack,
  createdAt,
  user,
}: ProjectCardProps) {
  return (
    <Link
      key={id}
      href={`/projects/${id}`}
      className="snap-start flex-shrink-0 w-80 bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all group"
    >
      <div className="h-36 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-[#5D7A57]/10 rounded-t-2xl flex items-center justify-center">
        <div className="text-5xl opacity-50">
          {typeIcons[type] || '🚀'}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition line-clamp-1 flex-1 mr-2">
            {title}
          </h3>
          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${typeColors[type] || 'bg-slate-100 text-slate-600'}`}>
            {typeLabels[type] || type}
          </span>
        </div>

        {description && (
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {description}
          </p>
        )}

        {outcome && (
          <div className="bg-[#F7FAF6]/50 rounded-lg p-3 mb-3">
            <p className="text-xs text-[#7A9A75] font-medium mb-1">🎉 成果</p>
            <p className="text-sm text-[#6B4E3D] line-clamp-1">{outcome}</p>
          </div>
        )}

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {techStack.slice(0, 3).map((tech) => (
              <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="text-xs text-slate-400">+{techStack.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                {user.name?.charAt(0) || '?'}
              </div>
              <span className="text-xs text-slate-500">{user.name}</span>
            </div>
          )}
          <span className="text-xs text-violet-600 font-medium group-hover:translate-x-1 transition-transform">
            查看详情 →
          </span>
        </div>
      </div>
    </Link>
  );
}