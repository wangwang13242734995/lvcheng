'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const typeLabels: Record<string, string> = {
  COURSE: '课程作业',
  COMPETITION: '比赛',
  INTERNSHIP: '实习',
  PERSONAL: '个人项目',
  CHALLENGE: '挑战赛',
};

const typeColors: Record<string, string> = {
  COURSE: 'bg-blue-100 text-blue-700',
  COMPETITION: 'bg-amber-100 text-amber-700',
  INTERNSHIP: 'bg-emerald-100 text-emerald-700',
  PERSONAL: 'bg-violet-100 text-violet-700',
  CHALLENGE: 'bg-rose-100 text-rose-700',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📂</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">我的项目</h1>
              <p className="text-slate-400 text-sm">记录你的每一个作品，让能力看得见</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{projects.length}</p>
          <p className="text-xs text-slate-500 mt-1">总项目数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{projects.filter(p => p.status === 'PUBLISHED').length}</p>
          <p className="text-xs text-slate-500 mt-1">已发布</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{projects.filter(p => p.videoUrl).length}</p>
          <p className="text-xs text-slate-500 mt-1">有视频</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-5xl mb-4 block">🚀</span>
          <p className="text-slate-600 mb-2 font-medium">还没有项目记录</p>
          <p className="text-slate-400 text-sm mb-6">记录第一个项目，开始你的能力成长之旅</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition"
          >
            <span>+</span> 记录第一个项目
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">全部项目</h2>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-900 to-green-950 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition shadow-sm"
            >
              <span className="text-lg leading-none">+</span> 新项目
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project: any) => {
              const techStack: string[] = project.techStack ? JSON.parse(project.techStack) : [];
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-green-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Card Top Bar */}
                  <div className={`h-1 ${project.videoUrl ? 'bg-gradient-to-r from-green-500 to-orange-500' : 'bg-slate-200'}`} />

                  <div className="p-5">
                    {/* Title & Status */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors line-clamp-1 flex-1 mr-2">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {project.videoUrl && (
                          <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center" title="有视频">
                            <span className="text-xs">🎬</span>
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          project.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {project.status === 'PUBLISHED' ? '已发布' : '草稿'}
                        </span>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium ${typeColors[project.type] || 'bg-slate-100 text-slate-600'}`}>
                      {typeLabels[project.type] || project.type}
                    </span>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed">{project.description}</p>
                    )}

                    {/* Outcome highlight */}
                    {project.outcome && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-amber-100 rounded flex items-center justify-center">
                          <span className="text-[10px]">🏆</span>
                        </span>
                        <p className="text-xs text-amber-700 font-medium line-clamp-1">{project.outcome}</p>
                      </div>
                    )}

                    {/* Tech Stack */}
                    {techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {techStack.slice(0, 3).map((tech: string) => (
                          <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {tech}
                          </span>
                        ))}
                        {techStack.length > 3 && (
                          <span className="text-xs text-slate-400">+{techStack.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">
                        {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                      <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
