'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const projectTypes = [
  { value: 'COURSE', label: '课程作业' },
  { value: 'COMPETITION', label: '比赛' },
  { value: 'INTERNSHIP', label: '实习' },
  { value: 'PERSONAL', label: '个人项目' },
  { value: 'CHALLENGE', label: '挑战赛' },
];

const outcomeTypes = [
  { value: '', label: '无' },
  { value: 'QUANTIFIED', label: '量化数据' },
  { value: 'AWARD', label: '获奖' },
  { value: 'LAUNCHED', label: '已上线' },
  { value: 'OPEN_SOURCE', label: '开源' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [links, setLinks] = useState<{ type: string; url: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState('');
  const [scoreResult, setScoreResult] = useState<{
    scoreChanges: Record<string, number>;
    newScores: Record<string, number>;
  } | null>(null);

  const [form, setForm] = useState({
    title: '',
    type: 'COURSE',
    role: '',
    teamSize: 1,
    startDate: '',
    endDate: '',
    description: '',
    difficulty: '',
    outcome: '',
    outcomeType: '',
    difficultyEncountered: '',
    solution: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const addLink = () => {
    setLinks([...links, { type: 'GitHub', url: '' }]);
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('视频文件不能超过 50MB');
      return;
    }

    setVideoUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '上传失败');
        setVideoUploading(false);
        return;
      }

      setVideoUrl(data.videoUrl);
      setVideoPreview(data.videoUrl);
      setVideoUploading(false);
    } catch {
      setError('上传失败，请稍后重试');
      setVideoUploading(false);
    }
  };

  const removeVideo = () => {
    setVideoUrl('');
    setVideoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          techStack,
          links,
          videoUrl,
          teamSize: parseInt(String(form.teamSize)) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '创建失败');
        setLoading(false);
        return;
      }

      // 显示分数变化反馈
      if (data.scoreChanges) {
        setScoreResult({
          scoreChanges: data.scoreChanges,
          newScores: data.newScores,
        });
      } else {
        router.push('/projects');
      }
    } catch {
      setError('网络错误');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">记录新项目</h1>
              <p className="text-slate-400 text-sm">每一个作品都是你能力的证明</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4 text-sm border border-red-100">{error}</div>
      )}

      {/* 分数变化反馈 */}
      {scoreResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <span className="text-4xl">🎉</span>
            <h2 className="text-xl font-bold text-slate-900 mt-4 mb-2">项目已记录！</h2>
            <p className="text-slate-500 text-sm mb-6">你的能力分数已更新</p>

            {/* 分数变化 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { key: 'craft', label: '专业力' },
                { key: 'learn', label: '学习力' },
                { key: 'drive', label: '自驱力' },
                { key: 'team', label: '协作力' },
                { key: 'grit', label: '抗压力' },
                { key: 'express', label: '表达力' },
              ].map((item) => {
                const change = scoreResult.scoreChanges[item.key] || 0;
                return (
                  <div key={item.key} className="py-2 bg-slate-50 rounded-lg">
                    <p className="text-lg font-bold text-slate-800">
                      {scoreResult.newScores[item.key] || 30}
                    </p>
                    {change > 0 && (
                      <p className="text-xs text-emerald-600 font-medium">+{change}</p>
                    )}
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-medium"
              >
                查看仪表盘
              </button>
              <button
                onClick={() => {
                  setScoreResult(null);
                  setForm({
                    title: '', type: 'COURSE', role: '', teamSize: 1,
                    startDate: '', endDate: '', description: '',
                    difficulty: '', outcome: '', outcomeType: '',
                    difficultyEncountered: '', solution: '', status: 'DRAFT',
                  });
                  setTechStack([]);
                  setLinks([]);
                }}
                className="w-full py-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
              >
                继续记录项目
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">📋</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">基本信息</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目类型</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                {projectTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">你的角色</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="如：前端开发、项目经理"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">团队规模</label>
              <input
                type="number"
                value={form.teamSize}
                onChange={(e) => updateField('teamSize', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🛠</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">技术栈 / 工具</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              placeholder="输入技术名称，按回车添加"
            />
            <button type="button" onClick={addTech} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm text-slate-700">
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span key={tech} className="bg-slate-800 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {tech}
                <button type="button" onClick={() => removeTech(tech)} className="text-slate-400 hover:text-white">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">项目描述</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目简介</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              rows={3}
              placeholder="简要描述项目内容和目标"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目难度</label>
            <input
              type="text"
              value={form.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              placeholder="如：使用了不熟悉的框架、时间紧迫等"
            />
          </div>
        </div>

        {/* Difficulty & Solution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">⚡</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">困难与解决</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              遇到的最大困难 <span className="text-gray-400">(50-200字)</span>
            </label>
            <textarea
              value={form.difficultyEncountered}
              onChange={(e) => updateField('difficultyEncountered', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              rows={3}
              maxLength={200}
              placeholder="描述你在项目中遇到的最大挑战"
            />
            <p className="text-xs text-gray-400 mt-1">{form.difficultyEncountered.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              如何解决的 <span className="text-gray-400">(50-200字)</span>
            </label>
            <textarea
              value={form.solution}
              onChange={(e) => updateField('solution', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              rows={3}
              maxLength={200}
              placeholder="描述你的解决方案和过程"
            />
            <p className="text-xs text-gray-400 mt-1">{form.solution.length}/200</p>
          </div>
        </div>

        {/* Outcome */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">项目成果</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成果类型</label>
              <select
                value={form.outcomeType}
                onChange={(e) => updateField('outcomeType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              >
                {outcomeTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成果描述</label>
              <input
                type="text"
                value={form.outcome}
                onChange={(e) => updateField('outcome', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="如：获得一等奖、DAU达到1000"
              />
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🎬</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">项目视频</h2>
            <span className="text-xs text-slate-400 ml-auto">可选，展示你的作品更有说服力</span>
          </div>
          {videoPreview ? (
            <div className="space-y-3">
              <video
                src={videoPreview}
                controls
                className="w-full rounded-lg bg-slate-900 max-h-64"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-600">✓ 视频已上传</p>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  移除视频
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={videoUploading}
                />
                {videoUploading ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-500">上传中...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-3xl">🎬</span>
                    <p className="text-sm font-medium text-slate-700">点击上传项目演示视频</p>
                    <p className="text-xs text-slate-400">支持 MP4、WebM、MOV，最大 50MB</p>
                  </div>
                )}
              </label>
              <p className="text-xs text-slate-400">💡 有视频的项目更能体现表达能力，企业也更关注</p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🔗</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800">相关链接</h2>
          </div>
          {links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={link.type}
                onChange={(e) => updateLink(index, 'type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="GitHub">GitHub</option>
                <option value="Design">设计稿</option>
                <option value="Video">视频</option>
                <option value="Live">线上地址</option>
              </select>
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(index, 'url', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="https://..."
              />
              <button type="button" onClick={() => removeLink(index)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg">
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addLink} className="text-slate-700 hover:text-slate-900 text-sm font-medium">
            + 添加链接
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-4 justify-end pt-2">
          <button
            type="button"
            onClick={() => router.push('/projects')}
            className="px-6 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-green-900 to-green-950 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition font-medium shadow-sm"
          >
            {loading ? '保存中...' : '保存项目'}
          </button>
        </div>
      </form>
    </div>
  );
}
