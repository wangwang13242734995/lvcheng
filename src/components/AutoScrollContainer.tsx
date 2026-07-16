'use client';

import { useEffect, useRef, useCallback, ReactNode } from 'react';

interface AutoScrollProps {
  children: ReactNode;
  speed?: number;
  scrollAmount?: number;
}

export default function AutoScrollContainer({
  children,
  speed = 0.3,
  scrollAmount = 320,
}: AutoScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const animationRef = useRef<number>(0);
  const maxScrollRef = useRef(0);

  const updateMaxScroll = useCallback(() => {
    if (scrollRef.current) {
      maxScrollRef.current = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      updateMaxScroll();
      const amount = direction === 'left' ? -scrollAmount : scrollAmount;
      let newOffset = offsetRef.current + amount;
      if (newOffset < 0) newOffset = 0;
      if (newOffset > maxScrollRef.current) newOffset = maxScrollRef.current;
      offsetRef.current = newOffset;
      scrollRef.current.scrollTo({ left: newOffset, behavior: 'smooth' });
    }
  }, [scrollAmount, updateMaxScroll]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    updateMaxScroll();

    const handleResize = () => updateMaxScroll();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      if (!pausedRef.current && scrollContainer) {
        if (maxScrollRef.current <= 0) {
          updateMaxScroll();
        } else {
          offsetRef.current += speed;
          if (offsetRef.current >= maxScrollRef.current) {
            offsetRef.current = 0;
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollContainer.scrollLeft = offsetRef.current;
          }
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [speed, updateMaxScroll]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={() => scrollByAmount('left')}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition z-10"
          aria-label="向左滚动"
        >
          ←
        </button>
        <button
          onClick={() => scrollByAmount('right')}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition z-10"
          aria-label="向右滚动"
        >
          →
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory marquee-scroll"
      >
        {children}
      </div>
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
