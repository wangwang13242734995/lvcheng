'use client';

import { useEffect, useRef, useCallback } from 'react';

interface EnterpriseItem {
  name: string;
  challengeCount: number;
  totalReward: number;
}

interface EnterpriseMarqueeProps {
  enterprises: EnterpriseItem[];
}

export default function EnterpriseMarquee({ enterprises }: EnterpriseMarqueeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    pausedRef.current = false;
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;

    const animate = () => {
      if (!pausedRef.current && scrollContainer) {
        offsetRef.current += 0.5;
        if (offsetRef.current >= scrollContainer.scrollWidth / 2) {
          offsetRef.current = 0;
        }
        scrollContainer.scrollLeft = offsetRef.current;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  if (enterprises.length === 0) return null;

  const doubled = [...enterprises, ...enterprises];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-hidden marquee-scroll"
      >
        {doubled.map((enterprise, index) => (
          <div
            key={`${enterprise.name}-${index}`}
            className="flex-shrink-0 flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-5 py-3 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg flex items-center justify-center text-xl">
              🏢
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">
                {enterprise.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{enterprise.challengeCount} 挑战</span>
                {enterprise.totalReward > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-blue-600 font-medium">
                      ¥{(enterprise.totalReward / 1000).toFixed(0)}k
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <style jsx>{`
        .marquee-scroll::-webkit-scrollbar {
          display: none;
        }
        .marquee-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
