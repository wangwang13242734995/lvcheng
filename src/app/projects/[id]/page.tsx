'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  COMPETITION: '🏅',
  INTERNSHIP: '💼',
  PERSONAL: '🔧',
  CHALLENGE: '⚔️',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('加载失败');
        return res.json();
      })
      .then((data) => {
        setProject(data);
        // 同类型推荐
        const params2 = new URLSearchParams({
          type: data.type,
          sort: 'newest',
        });
        return fetch(`/api/projects-explore?${params2.toString()}`)
          .then((r) => (r.ok ? r.json() : { projects: [] }))
          .then((relData) => {
            const list = (relData.projects || [])
              .filter((p: any) => p.id !== data.id)
              .slice(0, 3);
            setRelated(list);
          });
      })
      .catch((err) => {
        console.error('Failed to load project:', err);
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">加载中...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl mb-4 block">🔍</span>
        <p className="text-slate-600 font-medium">项目不存在</p>
        <Link href="/projects" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">返回项目列表</Link>
      </div>
    );
  }

  const techStack: string[] = project.techStack ? JSON.parse(project.techStack) : [];
  const links: { type: string; url: string }[] = project.links ? JSON.parse(project.links) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-4 transition group">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> 返回项目列表
      </Link>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#4A3728] to-[#2C1F14] rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#5D7A57]/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-orange-500/10 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-2xl">{typeIcons[project.type] || '📂'}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-lg">
                  {typeLabels[project.type] || project.type}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  project.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}>
                  {project.status === 'PUBLISHED' ? '✓ 已发布' : '草稿'}
                </span>
                {project.videoUrl && (
                  <span className="text-xs bg-[#5D7A57]/20 text-[#B3CEAD] px-2.5 py-1 rounded-lg flex items-center gap-1">
                    🎬 有视频
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            {project.role && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[10px]">👤</span>
                {project.role}
              </span>
            )}
            {project.teamSize && project.teamSize > 1 && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[10px]">👥</span>
                {project.teamSize} 人团队
              </span>
            )}
            {(project.startDate || project.endDate) && (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[10px]">📅</span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString('zh-CN') : '?'} ~ {project.endDate ? new Date(project.endDate).toLocaleDateString('zh-CN') : '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Author Card */}
      {project.user && (
        <Link
          href={`/profile/${project.user.id}`}
          className="block bg-white rounded-2xl border border-slate-200 p-4 mb-6 hover:border-[#D6E4D2] hover:shadow-sm transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B4E3D] to-[#2C1F14] flex items-center justify-center text-white font-medium shrink-0">
              {project.user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.user.avatar} alt={project.user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                project.user.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">项目作者</p>
              <p className="font-semibold text-slate-900 group-hover:text-[#7A9A75] transition">
                {project.user.name}
              </p>
            </div>
            <span className="text-slate-300 group-hover:text-[#5D7A57] transition">→</span>
          </div>
        </Link>
      )}

      {/* Video Section - Prominent */}
      {project.videoUrl && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-[#EDF3EB] rounded-lg flex items-center justify-center">
              <span className="text-sm">🎬</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">项目演示</h2>
          </div>
          <div className="p-5">
            <video
              src={project.videoUrl}
              controls
              className="w-full rounded-xl bg-slate-900 max-h-[480px]"
            />
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">项目描述</h2>
          </div>
          <div className="p-5">
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>
        </div>
      )}

      {/* Difficulty & Solution */}
      {(project.difficultyEncountered || project.solution) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">⚡</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">困难与解决</h2>
          </div>
          <div className="p-5 space-y-4">
            {project.difficultyEncountered && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">遇到的困难</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.difficultyEncountered}</p>
              </div>
            )}
            {project.solution && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">解决方案</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.solution}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outcome */}
      {project.outcome && (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-2xl border border-orange-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-orange-200/50 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-200/50 rounded-lg flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <h2 className="text-base font-semibold text-orange-900">项目成果</h2>
          </div>
          <div className="p-5">
            <p className="text-orange-800 font-medium">{project.outcome}</p>
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🛠</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">技术栈</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      {links.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🔗</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">相关链接</h2>
          </div>
          <div className="p-5 space-y-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group"
              >
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 group-hover:bg-[#EDF3EB] group-hover:text-[#4A6B43] transition">
                  {link.type === 'GitHub' ? '🐙' : link.type === 'Video' ? '🎬' : link.type === 'Design' ? '🎨' : '🌐'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#7A9A75] transition">{link.type}</p>
                  <p className="text-xs text-slate-400 truncate">{link.url}</p>
                </div>
                <span className="text-slate-300 group-hover:text-[#5D7A57] transition">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Projects */}
      {related.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">相关项目</h2>
            <Link href={`/explore?type=${project.type}`} className="text-sm text-[#4A6B43] hover:text-[#7A9A75]">
              查看更多 →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((p) => {
              const pTech: string[] = p.techStack ? JSON.parse(p.techStack) : [];
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#D6E4D2] hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                      {typeLabels[p.type] || p.type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#7A9A75] transition line-clamp-2 mb-2">
                    {p.title}
                  </h3>
                  {p.role && (
                    <p className="text-xs text-slate-500 mb-2">{p.role}</p>
                  )}
                  {pTech.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {pTech.slice(0, 3).map((t, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                      {pTech.length > 3 && (
                        <span className="text-xs text-slate-400">+{pTech.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Growth Records */}
      {project.growthRecords && project.growthRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">📈</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">成长记录</h2>
          </div>
          <div className="p-5 space-y-3">
            {project.growthRecords.map((record: any) => (
              <div key={record.id} className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-800">{record.title}</p>
                {record.content && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{record.content}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(record.date).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
