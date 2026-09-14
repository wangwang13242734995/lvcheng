'use client';

import Link from 'next/link';
import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import {
  AuroraBackground,
  Reveal,
  StaggerGroup,
  staggerItem,
  AnimatedHeading,
  AnimatedNumber,
  MagneticButton,
} from '@/components/motion/primitives';

const EnterpriseMarquee = lazy(() => import('@/components/EnterpriseMarquee'));

interface FeaturedUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  major: string | null;
  skills: string[];
  projectCount: number;
  scores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number; totalScore: number };
}
interface FeaturedProject {
  id: string;
  title: string;
  type: string;
  description: string | null;
  techStack: string[];
  outcome: string | null;
  outcomeType: string | null;
  difficulty: string | null;
  userId: string;
  user: { id: string; name: string; avatar: string | null };
  createdAt: string;
}
interface FeaturedChallenge {
  id: string;
  company: string;
  title: string;
  description: string;
  category: string;
  reward: string | null;
  rewardAmount: number;
  rewardType: string;
  deadline: string | null;
  spots: number | null;
  status: string;
  applicantCount: number;
}
interface FeaturedCompany {
  name: string;
  challengeCount: number;
  totalReward: number;
}
interface FeaturedData {
  users: FeaturedUser[];
  projects: FeaturedProject[];
  challenges: FeaturedChallenge[];
  companies: FeaturedCompany[];
}

// 演示数据已移除 - 首页只展示真实数据，避免虚假宣传

const typeLabel: Record<string, string> = {
  CHALLENGE: '挑战', PERSONAL: '个人项目', COMPETITION: '竞赛', INTERNSHIP: '实习',
};

export default function HomePage() {
  const [stats, setStats] = useState({ userCount: 0, projectCount: 0, recordCount: 0 });
  const [featured, setFeatured] = useState<FeaturedData>({ users: [], projects: [], challenges: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');

  useEffect(() => {
    fetch('/api/stats').then((r) => (r.ok ? r.json() : Promise.reject())).then(setStats).catch(() => {});
    fetch('/api/featured')
      .then((r) => r.json())
      .then((data) => {
        setFeatured(data || { users: [], projects: [], challenges: [], companies: [] });
      })
      .catch(() => setFeatured({ users: [], projects: [], challenges: [], companies: [] }))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = featured.users.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.major?.toLowerCase().includes(searchQuery.toLowerCase()) || u.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredProjects = featured.projects.filter(
    (p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statsArr = [
    { value: stats.userCount || 0, suffix: '+', label: '用作品说话的人' },
    { value: stats.projectCount || 0, suffix: '+', label: '被记录的作品' },
    { value: stats.recordCount || 0, suffix: '+', label: '可见的成长' },
    { value: featured.companies.length || 0, suffix: '+', label: '合作企业' },
  ];

  return (
    <div className="bg-[#0A0A0B] text-[#FAFAFA] antialiased selection:bg-[#6366F1]/30">
      {/* ============ HERO ============ */}
      <AuroraBackground className="min-h-[92vh] flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#2A2A30] bg-[#121214]/60 px-4 py-1.5 text-xs text-[#A1A1AA] backdrop-blur mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-pulse" />
            能力平权 · 公平展示
          </motion.div>

          <AnimatedHeading
            text="你的作品 比文凭更有说服力"
            className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl mx-auto"
          />
          <AnimatedHeading
            text="不靠标签 靠作品"
            delay={0.4}
            className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-[#818CF8] via-[#A855F7] to-[#22D3EE] bg-clip-text text-transparent"
          />

          <Reveal delay={0.7} y={16}>
            <p className="mt-7 text-base md:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
              别人凭什么判断你厉不厉害？不是证书，不是背书——是你做过什么、解决了什么、成长了多少。
              履程把你的真实能力变成看得见的数据。
            </p>
          </Reveal>

          <Reveal delay={0.9} y={16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton
                href="/auth/login"
                primary
                className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-7 py-3.5 text-base font-medium text-white hover:bg-[#818CF8] transition-colors"
              >
                用作品证明自己 <span aria-hidden>→</span>
              </MagneticButton>
              <MagneticButton
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A30] px-7 py-3.5 text-base font-medium text-[#FAFAFA] hover:bg-[#121214] transition-colors"
              >
                登录
              </MagneticButton>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={1.1}>
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-[#2A2A30] bg-[#2A2A30]">
              {statsArr.map((s) => (
                <div key={s.label} className="bg-[#0A0A0B] px-4 py-7">
                  <div className="text-3xl md:text-4xl font-semibold tracking-tight">
                    <AnimatedNumber value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-[#71717A]">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </AuroraBackground>

      {/* ============ 企业 marquee ============ */}
      {featured.companies.length > 0 && (
      <section className="border-y border-[#2A2A30] bg-[#0A0A0B] py-10">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[#71717A] mb-6">已有这些企业在这里寻找人才</p>
        <Suspense fallback={<div className="h-10" />}>
          <div className="[&_*]:!text-[#A1A1AA] [&_.border]:!border-[#2A2A30] opacity-60 hover:opacity-100 transition-opacity">
            <EnterpriseMarquee enterprises={featured.companies} />
          </div>
        </Suspense>
      </section>
      )}

      {/* ============ 人才 / 项目 bento ============ */}
      <section className="bg-[#0A0A0B] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-[#6366F1] mb-3">✦ 发现人才与作品</p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">他们在用作品说话</h2>
              <p className="text-[#A1A1AA] mt-2">不看标签，看能力——这些人已经用项目证明了自己</p>
            </Reveal>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-xl border border-[#2A2A30] bg-[#121214] p-1">
                {(['users', 'projects'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${activeTab === t ? 'bg-[#6366F1] text-white' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'}`}
                  >
                    {t === 'users' ? '人才' : '项目'}
                  </button>
                ))}
              </div>
              <Link href={activeTab === 'users' ? '/talents' : '/explore'} className="text-sm text-[#A1A1AA] hover:text-[#818CF8] transition">
                查看全部 →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#71717A]">加载中...</div>
          ) : activeTab === 'users' ? (
            filteredUsers.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-[#2A2A30]">
                <p className="text-[#A1A1AA] mb-2">还没有人才展示</p>
                <p className="text-sm text-[#71717A]">成为第一个用作品说话的人</p>
              </div>
            ) : (
            <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((u) => (
                <motion.div
                  key={u.id}
                  variants={staggerItem}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative rounded-2xl border border-[#2A2A30] bg-[#121214] p-6 hover:border-[#6366F1]/50 transition-colors"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(400px circle at var(--x,50%) var(--y,50%), rgba(99,102,241,0.12), transparent 40%)' }} />
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center font-semibold">{u.name[0]}</div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-[#71717A]">{u.major}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-semibold tracking-tight">{u.scores.totalScore}</div>
                      <div className="text-[10px] text-[#71717A] uppercase tracking-wider">综合</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#A1A1AA] mb-4 line-clamp-1">{u.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {u.skills.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md border border-[#2A2A30] bg-[#1A1A1F] px-2 py-0.5 text-xs text-[#A1A1AA]">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#2A2A30]">
                    <span className="text-xs text-[#71717A]">{u.projectCount} 个项目</span>
                    <Link href={`/profile/${u.id}`} className="text-xs text-[#818CF8] hover:text-[#A5B4FC] transition">查看名片 →</Link>
                  </div>
                </motion.div>
              ))}
            </StaggerGroup>
            )
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-[#2A2A30]">
              <p className="text-[#A1A1AA] mb-2">还没有项目展示</p>
              <p className="text-sm text-[#71717A]">记录你的第一个项目，让能力被看见</p>
            </div>
          ) : (
            <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredProjects.map((p) => (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group rounded-2xl border border-[#2A2A30] bg-[#121214] p-6 hover:border-[#6366F1]/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-md bg-[#6366F1]/15 text-[#818CF8] px-2 py-0.5 text-xs font-medium">{typeLabel[p.type] || p.type}</span>
                    {p.difficulty && <span className="text-xs text-[#71717A]">· {p.difficulty === 'HARD' ? '高难度' : p.difficulty === 'MEDIUM' ? '中等' : '入门'}</span>}
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-[#818CF8] transition-colors">{p.title}</h3>
                  <p className="text-sm text-[#A1A1AA] mb-3 line-clamp-2">{p.description}</p>
                  {p.outcome && (
                    <div className="mb-4 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2 text-sm text-[#FCD34D]">
                      ✓ {p.outcome}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.techStack.map((t) => (
                      <span key={t} className="rounded-md border border-[#2A2A30] bg-[#1A1A1F] px-2 py-0.5 text-xs text-[#A1A1AA]">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#2A2A30]">
                    <span className="text-xs text-[#71717A]">by {p.user.name}</span>
                    <Link href={`/projects/${p.id}`} className="text-xs text-[#818CF8] hover:text-[#A5B4FC] transition">查看 →</Link>
                  </div>
                </motion.div>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* ============ 企业挑战 ============ */}
      <section className="bg-[#0A0A0B] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#2A2A30] bg-gradient-to-br from-[#121214] to-[#0A0A0B] p-8 md:p-14">
              <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 60%)' }} />
              <div className="relative">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6366F1] mb-3">⚔ 企业真实问题</p>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">用能力接招，不用简历敲门</h2>
                  <p className="text-[#A1A1AA] mt-2 max-w-xl mx-auto">完成企业发布的真实挑战，获得认证和奖金，让能力直接被看见</p>
                </div>
                {featured.challenges.length > 0 ? (
                  <StaggerGroup className="grid md:grid-cols-3 gap-5">
                    {featured.challenges.slice(0, 3).map((c) => (
                      <motion.div key={c.id} variants={staggerItem} className="rounded-2xl border border-[#2A2A30] bg-[#1A1A1F]/60 p-6 hover:border-[#6366F1]/40 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-[#FAFAFA]">{c.company}</span>
                          <span className="rounded-md bg-[#F59E0B]/15 px-2 py-0.5 text-xs text-[#FCD34D]">{c.rewardAmount ? `¥${c.rewardAmount.toLocaleString()}` : '奖金'}</span>
                        </div>
                        <h3 className="text-base font-medium mb-2">{c.title}</h3>
                        <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-4">{c.description}</p>
                        <div className="flex items-center justify-between text-xs text-[#71717A]">
                          <span>{c.applicantCount} 人报名</span>
                          <Link href={`/challenges/${c.id}`} className="text-[#818CF8] hover:text-[#A5B4FC] transition">参与 →</Link>
                        </div>
                      </motion.div>
                    ))}
                  </StaggerGroup>
                ) : (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-[#2A2A30]">
                    <p className="text-[#A1A1AA] mb-2">暂无企业挑战</p>
                    <p className="text-sm text-[#71717A]">企业合作正在洽谈中，敬请期待</p>
                  </div>
                )}
                <div className="text-center mt-10">
                  <MagneticButton href="/challenges" className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-7 py-3.5 text-base font-medium text-[#1A1A1F] hover:bg-[#FCD34D] transition-colors">
                    浏览全部挑战 <span aria-hidden>→</span>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 痛点 / 解法 bento ============ */}
      <section className="bg-[#0A0A0B] py-24 border-t border-[#2A2A30]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">一张纸，装不下真实的你</h2>
            <p className="text-[#A1A1AA] mt-3 max-w-2xl mx-auto leading-relaxed">
              传统筛选看标签，面试看印象。但真正让你与众不同的，是你熬过的夜、解过的难题、做过的项目。
            </p>
          </Reveal>
          <StaggerGroup className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '⚡', title: '数据替你说话', desc: '六维能力模型不是别人打分——是你的项目数量、困难复杂度、成长斜率自动算出来的。', hl: '你的专业力是42还是78，不取决于谁的印象。' },
              { icon: '🔗', title: '作品可以验证', desc: '每个项目都带着证据——代码链接、上线产品、获奖证明、量化数据。', hl: '不是你说你厉害，是作品证明你厉害。' },
              { icon: '📈', title: '成长看得见', desc: '你的能力不是一天练成的，但简历上只有一个结果。履程记录的是过程。', hl: '从30分到70分的成长轨迹，比证书更有说服力。' },
            ].map((f, i) => (
              <motion.div key={i} variants={staggerItem} className="rounded-2xl border border-[#2A2A30] bg-[#121214] p-7 hover:border-[#6366F1]/40 transition-colors">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A1A1F] text-xl">{f.icon}</div>
                <h3 className="text-lg font-medium mb-2">{f.title}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{f.desc} <span className="text-[#818CF8]">{f.hl}</span></p>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-[#0A0A0B] py-28">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.18), transparent 70%)' }} />
        <Reveal className="relative text-center max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">别让标签定义你</h2>
          <p className="text-[#A1A1AA] mt-4 text-lg">
            有人什么都做过，有人什么都没做过。区别不在出身，在于你做了什么。<br />在这里，作品说了算。
          </p>
          <div className="mt-10">
            <MagneticButton href="/auth/login" primary className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-9 py-4 text-lg font-medium text-white hover:bg-[#818CF8] transition-colors">
              用作品证明自己 <span aria-hidden>→</span>
            </MagneticButton>
          </div>
        </Reveal>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-[#2A2A30] bg-[#0A0A0B] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-3">履程</p>
              <p className="text-sm text-[#71717A] leading-relaxed">用作品说话的能力展示平台，让每个人的成长都被看见。</p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-[#A1A1AA]">了解</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-[#71717A] hover:text-[#818CF8] transition">关于我们</Link></li>
                <li><Link href="/challenges" className="text-[#71717A] hover:text-[#818CF8] transition">挑战广场</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-[#A1A1AA]">条款</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-[#71717A] hover:text-[#818CF8] transition">隐私政策</Link></li>
                <li><Link href="/terms" className="text-[#71717A] hover:text-[#818CF8] transition">服务条款</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#2A2A30] pt-6 text-center text-sm text-[#52525B]">© 2026 履程 · 作品胜过文凭</div>
        </div>
      </footer>
    </div>
  );
}
