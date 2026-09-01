'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate, useScroll, useTransform, type Variants } from 'motion/react';
import Link from 'next/link';

/* ---------- Aurora 动态渐变背景 ---------- */
export function AuroraBackground({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(99,102,241,0.35) 0%, transparent 60%),' +
            'radial-gradient(ellipse 60% 40% at 75% 15%, rgba(168,85,247,0.28) 0%, transparent 60%),' +
            'radial-gradient(ellipse 70% 60% at 50% 90%, rgba(34,211,238,0.18) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 30% 20%, rgba(99,102,241,0.25) 0%, transparent 55%)',
          animation: 'aurora-shift 9s ease-in-out infinite alternate',
        }}
      />
      <style>{`@keyframes aurora-shift{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(-30px,-20px,0) scale(1.08)}}@media(prefers-reduced-motion:reduce){.aurora-wrap{animation:none}}`}</style>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ---------- Reveal：滚动入场 ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Stagger 容器 + 子项 ---------- */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- 逐词入场标题 ---------- */
export function AnimatedHeading({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(' ');
  return (
    <motion.h1
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%', opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

/* ---------- 数字滚动 ---------- */
export function AnimatedNumber({
  value,
  suffix = '',
  duration = 1.8,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}

/* ---------- 磁性悬停按钮 ---------- */
const MotionLink = motion(Link);
export function MagneticButton({
  href,
  children,
  className,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  primary?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });
  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }
  const style: CSSProperties = primary
    ? { boxShadow: '0 0 24px rgba(99,102,241,0.45), 0 0 64px rgba(99,102,241,0.18)' }
    : {};
  return (
    <MotionLink
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, ...style }}
      className={className}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </MotionLink>
  );
}

/* ---------- 视差层 ---------- */
export function Parallax({
  children,
  offset = 80,
  className,
}: {
  children: ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
