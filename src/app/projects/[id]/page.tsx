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

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((res) => res.json())
      .then((data) => setProject(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">加载中...</p></div>;
  }

  if (!project) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">项目不存在</p></div>;
  }

  const techStack: string[] = project.techStack ? JSON.parse(project.techStack) : [];
  const links: { type: string; url: string }[] = project.links ? JSON.parse(project.links) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/projects" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">
        ← 返回项目列表
      </Link>

      <div className="bg-white p-8 rounded-xl mt-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex gap-2 mt-2">
              <span className="text-sm bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                {typeLabels[project.type] || project.type}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${
                project.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {project.status === 'PUBLISHED' ? '已发布' : '草稿'}
              </span>
            </div>
          </div>
        </div>

        {project.role && (
          <p className="text-gray-600 mb-2">角色：{project.role}</p>
        )}
        {project.teamSize && (
          <p className="text-gray-600 mb-2">团队规模：{project.teamSize} 人</p>
        )}
        {(project.startDate || project.endDate) && (
          <p className="text-gray-600 mb-4">
            时间：{project.startDate ? new Date(project.startDate).toLocaleDateString('zh-CN') : '?'} ~ {project.endDate ? new Date(project.endDate).toLocaleDateString('zh-CN') : '?'}
          </p>
        )}

        {project.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">项目描述</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {techStack.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">技术栈</h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {project.difficultyEncountered && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">遇到的困难</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.difficultyEncountered}</p>
          </div>
        )}

        {project.solution && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">解决方案</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.solution}</p>
          </div>
        )}

        {project.outcome && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">项目成果</h2>
            <p className="text-gray-700">{project.outcome}</p>
          </div>
        )}

        {links.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">相关链接</h2>
            <div className="space-y-2">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline block"
                >
                  {link.type}: {link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Growth Records */}
        {project.growthRecords && project.growthRecords.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">成长记录</h2>
            <div className="space-y-2">
              {project.growthRecords.map((record: any) => (
                <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{record.title}</p>
                  {record.content && <p className="text-sm text-gray-600 mt-1">{record.content}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
