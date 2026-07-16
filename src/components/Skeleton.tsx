'use client';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-100 rounded animate-pulse ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton({ width = 'w-72', height = 'h-72' }: { width?: string; height?: string }) {
  return (
    <div className={`flex-shrink-0 ${width} ${height} bg-slate-100 rounded-2xl animate-pulse`} />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 bg-slate-100 rounded-2xl animate-pulse">
      <div className="h-36 rounded-t-2xl bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded" />
        <div className="flex gap-2">
          <div className="w-12 h-4 bg-slate-200 rounded" />
          <div className="w-12 h-4 bg-slate-200 rounded" />
          <div className="w-12 h-4 bg-slate-200 rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t border-slate-200">
          <div className="flex gap-2">
            <div className="w-6 h-6 bg-slate-200 rounded-full" />
            <div className="w-16 h-4 bg-slate-200 rounded" />
          </div>
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="bg-slate-100 rounded-xl animate-pulse p-5">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 h-8 bg-slate-200 rounded-lg" />
    </div>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="bg-slate-700/30 rounded-2xl animate-pulse p-5">
      <div className="flex gap-2 mb-3">
        <div className="w-8 h-8 bg-slate-600 rounded-lg" />
        <div className="h-4 bg-slate-600 rounded w-24" />
      </div>
      <div className="h-4 bg-slate-600 rounded w-4/5 mb-2" />
      <div className="h-4 bg-slate-600 rounded w-3/4 mb-3" />
      <div className="flex justify-between">
        <div className="h-4 bg-slate-600 rounded w-16" />
        <div className="h-4 bg-slate-600 rounded w-20" />
      </div>
    </div>
  );
}

export default Skeleton;