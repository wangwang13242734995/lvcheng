'use client';

import Link from 'next/link';
import { useEffect, useState, lazy, Suspense } from 'react';

const TalentCard = lazy(() => import('@/components/TalentCard'));
const ProjectCard = lazy(() => import('@/components/ProjectCard'));
const CompanyCard = lazy(() => import('@/components/CompanyCard'));
const ChallengeCard = lazy(() => import('@/components/ChallengeCard'));
const EnterpriseMarquee = lazy(() => import('@/components/EnterpriseMarquee'));
const AutoScrollContainer = lazy(() => import('@/components/AutoScrollContainer'));

interface FeaturedUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  major: string | null;
  skills: string[];
  projectCount: number;
  scores: {
    craft: number;
    learn: number;
    drive: number;
    team: number;
    grit: number;
    express: number;
    totalScore: number;
  };
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
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
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

const mockUsers: FeaturedUser[] = [
  {
    id: '1',
    name: '张明宇',
    avatar: null,
    bio: '全栈工程师，热爱开源',
    major: '计算机科学',
    skills: ['React', 'Node.js', 'TypeScript'],
    projectCount: 12,
    scores: { craft: 85, learn: 78, drive: 82, team: 75, grit: 80, express: 72, totalScore: 79 },
  },
  {
    id: '2',
    name: '李思琪',
    avatar: null,
    bio: '产品设计师，用户体验专家',
    major: '工业设计',
    skills: ['Figma', 'UI/UX', '用户研究'],
    projectCount: 8,
    scores: { craft: 72, learn: 85, drive: 78, team: 88, grit: 70, express: 90, totalScore: 81 },
  },
  {
    id: '3',
    name: '王浩然',
    avatar: null,
    bio: '算法工程师，AI 方向',
    major: '人工智能',
    skills: ['Python', 'PyTorch', 'NLP'],
    projectCount: 15,
    scores: { craft: 92, learn: 90, drive: 85, team: 70, grit: 88, express: 65, totalScore: 82 },
  },
  {
    id: '4',
    name: '陈雨婷',
    avatar: null,
    bio: '前端开发，性能优化专家',
    major: '软件工程',
    skills: ['Vue.js', 'Webpack', '性能优化'],
    projectCount: 10,
    scores: { craft: 80, learn: 82, drive: 75, team: 80, grit: 76, express: 78, totalScore: 78 },
  },
  {
    id: '5',
    name: '刘子轩',
    avatar: null,
    bio: '后端架构师，分布式系统',
    major: '计算机工程',
    skills: ['Go', 'Kubernetes', '微服务'],
    projectCount: 20,
    scores: { craft: 88, learn: 75, drive: 90, team: 82, grit: 85, express: 70, totalScore: 82 },
  },
  {
    id: '6',
    name: '赵小蕾',
    avatar: null,
    bio: '数据分析，商业洞察',
    major: '统计学',
    skills: ['SQL', 'Python', 'Tableau'],
    projectCount: 7,
    scores: { craft: 70, learn: 88, drive: 72, team: 85, grit: 68, express: 85, totalScore: 78 },
  },
];

const mockProjects: FeaturedProject[] = [
  {
    id: 'p1',
    title: '智能客服系统重构',
    type: 'CHALLENGE',
    description: '基于大语言模型重构企业客服系统，实现 80% 常见问题自动回复',
    techStack: ['React', 'Python', 'LangChain', 'PostgreSQL'],
    outcome: '响应时间从 30s 降至 2s，客户满意度提升 45%',
    outcomeType: 'QUANTIFIED',
    difficulty: 'HARD',
    userId: '1',
    user: { id: '1', name: '张明宇', avatar: null },
    createdAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'p2',
    title: '移动端设计系统',
    type: 'PERSONAL',
    description: '从零搭建一套完整的移动端设计系统，包含 200+ 组件',
    techStack: ['Figma', 'Design System', 'React Native'],
    outcome: '团队开发效率提升 60%，设计一致性达 95%',
    outcomeType: 'LAUNCHED',
    difficulty: 'MEDIUM',
    userId: '2',
    user: { id: '2', name: '李思琪', avatar: null },
    createdAt: '2026-06-10T00:00:00Z',
  },
  {
    id: 'p3',
    title: '论文：基于Transformer的代码生成',
    type: 'COMPETITION',
    description: '参加全国大学生计算机设计大赛的获奖项目',
    techStack: ['PyTorch', 'Transformer', 'CodeGen'],
    outcome: '全国一等奖',
    outcomeType: 'AWARD',
    difficulty: 'HARD',
    userId: '3',
    user: { id: '3', name: '王浩然', avatar: null },
    createdAt: '2026-05-20T00:00:00Z',
  },
  {
    id: 'p4',
    title: '电商平台首页性能优化',
    type: 'INTERNSHIP',
    description: '实习期间负责电商首页性能优化项目',
    techStack: ['Vue.js', 'Webpack', 'CDN'],
    outcome: '首屏加载时间从 4.2s 降至 1.5s，LCP 提升 64%',
    outcomeType: 'QUANTIFIED',
    difficulty: 'MEDIUM',
    userId: '4',
    user: { id: '4', name: '陈雨婷', avatar: null },
    createdAt: '2026-06-01T00:00:00Z',
  },
];

const mockChallenges: FeaturedChallenge[] = [
  {
    id: 'c1',
    company: '字节跳动',
    title: 'AI 面试助手开发挑战',
    description: '开发一个基于AI的智能面试助手系统，帮助候选人更好地准备面试',
    category: 'TECH',
    reward: '一等奖 ¥10,000 + 绿卡',
    rewardAmount: 10000,
    rewardType: 'CASH',
    deadline: '2026-08-15T00:00:00Z',
    spots: 50,
    status: 'OPEN',
    applicantCount: 23,
  },
  {
    id: 'c2',
    company: '腾讯',
    title: '小程序体验优化',
    description: '针对微信小程序进行性能优化和用户体验改进',
    category: 'TECH',
    reward: '二等奖 ¥5,000',
    rewardAmount: 5000,
    rewardType: 'CASH',
    deadline: '2026-07-30T00:00:00Z',
    spots: 30,
    status: 'OPEN',
    applicantCount: 18,
  },
  {
    id: 'c3',
    company: '小红书',
    title: '内容推荐算法优化',
    description: '优化内容推荐算法，提升用户互动率和内容消费时长',
    category: 'TECH',
    reward: '实习 offer + ¥8,000',
    rewardAmount: 8000,
    rewardType: 'CASH',
    deadline: '2026-08-01T00:00:00Z',
    spots: 20,
    status: 'OPEN',
    applicantCount: 35,
  },
];

const mockCompanies: FeaturedCompany[] = [
  { name: '字节跳动', challengeCount: 8, totalReward: 50000 },
  { name: '腾讯', challengeCount: 6, totalReward: 35000 },
  { name: '阿里巴巴', challengeCount: 5, totalReward: 42000 },
  { name: '小红书', challengeCount: 4, totalReward: 28000 },
  { name: '美团', challengeCount: 3, totalReward: 20000 },
  { name: '网易', challengeCount: 2, totalReward: 15000 },
  { name: '小米', challengeCount: 3, totalReward: 18000 },
  { name: '华为', challengeCount: 4, totalReward: 30000 },
];

export default function HomePage() {
  const [stats, setStats] = useState({ userCount: 0, projectCount: 0, recordCount: 0 });
  const [featured, setFeatured] = useState<FeaturedData>({
    users: [],
    projects: [],
    challenges: [],
    companies: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => {
        if (!r.ok) throw new Error('加载失败');
        return r.json();
      })
      .then(setStats)
      .catch((err) => {
        console.error('Failed to load stats:', err);
      });

    fetch('/api/featured')
      .then((r) => r.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          setFeatured(data);
        } else {
          setFeatured({
            users: mockUsers,
            projects: mockProjects,
            challenges: mockChallenges,
            companies: mockCompanies,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load featured data:', err);
        setFeatured({
          users: mockUsers,
          projects: mockProjects,
          challenges: mockChallenges,
          companies: mockCompanies,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = featured.users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProjects = featured.projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.techStack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-[#F7FAF6]/30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#EDF3EB]/30 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16">
          <div className="text-center">
            <p className="text-sm font-medium tracking-widest text-orange-600 uppercase mb-4">
              能力平权 · 公平展示
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              你的作品，
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                比文凭更有说服力
              </span>
            </h1>
            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              别人凭什么判断你厉不厉害？不是证书，不是背书——是你做过什么、解决了什么、成长了多少。
              履程把你的真实能力变成看得见的数据——不靠标签，靠作品。
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索人才、项目、技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-12 rounded-xl border border-slate-200 focus:border-[#5D7A57] focus:ring-2 focus:ring-[#5D7A57]/20 transition shadow-sm"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-[#4A3728] to-[#6B4E3D] text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:from-[#6B4E3D] hover:to-[#3D5A37] transition shadow-lg shadow-[#4A3728]/20"
              >
                用作品证明自己
              </Link>
              <Link
                href="/auth/login"
                className="border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl text-lg font-medium hover:bg-slate-50 transition"
              >
                登录
              </Link>
            </div>
          </div>

          {/* 企业滚动展示 */}
          <div className="mt-12">
            <p className="text-center text-sm text-slate-400 mb-6">已有这些企业在这里寻找人才</p>
            {loading ? (
              <div className="flex justify-center gap-4 opacity-60">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 w-32 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <Suspense fallback={<div className="flex justify-center gap-4 opacity-60">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 w-32 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>}>
                <EnterpriseMarquee enterprises={featured.companies} />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center gap-12">
            <div className="text-center">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7A9A75] to-[#5D7A57]">
                {stats.userCount || 128}+
              </p>
              <p className="text-sm text-slate-400 mt-2">用作品说话的人</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                {stats.projectCount || 356}+
              </p>
              <p className="text-sm text-slate-400 mt-2">被记录的作品</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-500">
                {stats.recordCount || 1024}+
              </p>
              <p className="text-sm text-slate-400 mt-2">可见的成长</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                {featured.companies.length || 8}+
              </p>
              <p className="text-sm text-slate-400 mt-2">合作企业</p>
            </div>
          </div>
        </div>
      </section>

      {/* 优秀人才墙 & 精选项目 - Tab 切换 */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-2">✨ 发现人才与作品</p>
              <h2 className="text-3xl font-bold text-slate-900">他们在用作品说话</h2>
              <p className="text-slate-500 mt-2">不看标签，看能力——这些人已经用项目证明了自己</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'users'
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  👥 人才
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'projects'
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🚀 项目
                </button>
              </div>
              <Link
                href={activeTab === 'users' ? '/talents' : '/explore'}
                className="text-sm text-slate-500 hover:text-[#7A9A75] transition font-medium"
              >
                查看全部 →
              </Link>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              {loading ? (
                <div className="flex gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-72 h-72 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <Suspense fallback={<div className="flex gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-72 h-72 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>}>
                  <AutoScrollContainer speed={0.3} scrollAmount={320}>
                    {filteredUsers.map((user) => (
                      <TalentCard
                        key={user.id}
                        id={user.id}
                        name={user.name}
                        avatar={user.avatar}
                        projectCount={user.projectCount}
                        scores={user.scores}
                        skills={user.skills}
                        bio={user.bio}
                      />
                    ))}
                  </AutoScrollContainer>
                </Suspense>
              ) : (
                <div className="flex-shrink-0 w-full text-center py-12">
                  <p className="text-slate-400">未找到匹配的人才</p>
                </div>
              )}
            </>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <>
              {loading ? (
                <div className="flex gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-80 bg-slate-100 rounded-xl animate-pulse p-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-2/3 mb-4" />
                      <div className="flex gap-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-6 bg-slate-200 rounded px-3" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length > 0 ? (
                <Suspense fallback={<div className="flex gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-80 bg-slate-100 rounded-xl animate-pulse p-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-2/3 mb-4" />
                      <div className="flex gap-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-6 bg-slate-200 rounded px-3" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>}>
                  <AutoScrollContainer speed={0.3} scrollAmount={380}>
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        id={project.id}
                        title={project.title}
                        type={project.type}
                        description={project.description}
                        outcome={project.outcome}
                        techStack={project.techStack}
                        createdAt={project.createdAt}
                        user={project.user}
                      />
                    ))}
                  </AutoScrollContainer>
                </Suspense>
              ) : (
                <div className="flex-shrink-0 w-full text-center py-12">
                  <p className="text-slate-400">未找到匹配的项目</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 合作企业展示 */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-blue-600 mb-2">🏢 合作企业</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">这些企业都在这里找人</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              不筛学历，只看能力——企业通过真实挑战寻找真正能解决问题的人
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featured.companies.map((company) => (
                  <CompanyCard
                    key={company.name}
                    name={company.name}
                    challengeCount={company.challengeCount}
                    totalReward={company.totalReward}
                  />
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </section>

      {/* 挑战广场预览 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#4A3728] via-[#6B4E3D] to-[#2C1F14] rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">⚔️</span>
                  <span className="text-[#D6E4D2]/80 text-sm font-medium">企业真实问题</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">用能力接招，不用简历敲门</h2>
                <p className="text-[#D6E4D2]/70 max-w-xl mx-auto">
                  完成企业发布的真实挑战，获得认证和奖金，让能力直接被看见
                </p>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-3 gap-5 mb-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg" />
                        <div className="h-4 bg-white/20 rounded w-1/2" />
                      </div>
                      <div className="h-5 bg-white/20 rounded w-full mb-3" />
                      <div className="h-3 bg-white/15 rounded w-full mb-2" />
                      <div className="h-3 bg-white/15 rounded w-3/4 mb-4" />
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-orange-500/30 rounded px-3 flex items-center" />
                        <div className="h-3 bg-white/15 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Suspense fallback={<div className="grid md:grid-cols-3 gap-5 mb-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg" />
                        <div className="h-4 bg-white/20 rounded w-1/2" />
                      </div>
                      <div className="h-5 bg-white/20 rounded w-full mb-3" />
                      <div className="h-3 bg-white/15 rounded w-full mb-2" />
                      <div className="h-3 bg-white/15 rounded w-3/4 mb-4" />
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-orange-500/30 rounded px-3 flex items-center" />
                        <div className="h-3 bg-white/15 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>}>
                  <div className="grid md:grid-cols-3 gap-5 mb-10">
                    {featured.challenges.slice(0, 3).map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        id={challenge.id}
                        company={challenge.company}
                        title={challenge.title}
                        description={challenge.description}
                        category={challenge.category}
                        reward={challenge.reward}
                        rewardAmount={challenge.rewardAmount}
                        applicantCount={challenge.applicantCount}
                      />
                    ))}
                  </div>
                </Suspense>
              )}

              <div className="text-center">
                <Link
                  href="/challenges"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-400 transition shadow-lg shadow-orange-500/25"
                >
                  浏览全部挑战
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 痛点 + 解法 */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">一张纸，装不下真实的你</h2>
          <p className="text-center text-slate-500 mb-16 max-w-2xl mx-auto leading-relaxed">
            传统筛选看标签，面试看印象，第一份工作还是看关系。<br />
            但你明明知道——真正让你与众不同的，是你熬过的夜、解过的难题、做过的项目。
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">数据替你说话</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                六维能力模型不是别人给你打分——是你的项目数量、困难复杂度、成长斜率自动算出来的。
                <strong className="text-slate-700">你的专业力是42还是78，不取决于谁的印象，取决于你做了什么。</strong>
              </p>
            </div>
            <div className="bg-white p-7 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">作品可以验证</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                每个项目都带着证据——代码链接、上线产品、获奖证明、量化数据。
                <strong className="text-slate-700">不是你说你厉害，是你的作品证明你厉害。</strong>
                这是简历做不到的。
              </p>
            </div>
            <div className="bg-white p-7 rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">成长看得见</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                你的能力不是一天练成的，但简历上只有一个结果。
                <strong className="text-slate-700">履程记录的是过程——从30分到70分的成长轨迹，比任何证书都有说服力。</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#4A3728] to-[#2C1F14] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">别让标签定义你</h2>
          <p className="text-[#EDF3EB]/70 mb-8 max-w-lg mx-auto text-lg">
            有人什么都做过，有人什么都没做过。区别不在出身，在于你做了什么。
            <br />
            在这里，作品说了算。
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-orange-400 transition shadow-xl shadow-orange-500/30"
          >
            用作品证明自己
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-white font-semibold mb-3">履程</p>
              <p className="text-sm leading-relaxed">用作品说话的能力展示平台，让每个人的成长都被看见。</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">了解</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    关于我们
                  </Link>
                </li>
                <li>
                  <Link href="/challenges" className="hover:text-white transition">
                    挑战广场
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">条款</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    隐私政策
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    服务条款
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-sm">© 2026 履程 · 作品胜过文凭</p>
          </div>
        </div>
      </footer>
    </div>
  );
}