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
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的项目</h1>
        <Link
          href="/projects/new"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition text-sm font-medium"
        >
          + 新项目
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">还没有项目记录</p>
          <Link href="/projects/new" className="text-amber-600 hover:underline font-medium">
            记录第一个项目
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white p-5 rounded-xl hover:ring-2 hover:ring-indigo-200 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{project.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {project.status === 'PUBLISHED' ? '已发布' : '草稿'}
                </span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {typeLabels[project.type] || project.type}
              </span>
              {project.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.description}</p>
              )}
              {project.techStack && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {JSON.parse(project.techStack || '[]').slice(0, 3).map((tech: string) => (
                    <span key={tech} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(project.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
