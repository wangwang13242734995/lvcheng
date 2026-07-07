'use client';

import { useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import AbilityRadarChart from './AbilityRadarChart';

interface ShareCardProps {
  userName: string;
  scores: {
    craft: number;
    learn: number;
    drive: number;
    team: number;
    grit: number;
    express: number;
    totalScore: number;
  };
  projectCount: number;
  growthCount: number;
}

export default function ShareCard({ userName, scores, projectCount, growthCount }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${userName}-履程能力名片.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('生成图片失败:', err);
    }
  }, [userName]);

  return (
    <div className="space-y-4">
      {/* 可导出的卡片 */}
      <div
        ref={cardRef}
        className="bg-white p-8 rounded-2xl border border-slate-200 max-w-sm mx-auto"
      >
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-green-900 rounded-full flex items-center justify-center text-xl text-white font-bold">
            {userName?.[0] || '?'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{userName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold text-lg">{scores.totalScore || 30}</span>
              <span className="text-xs text-slate-400">综合得分</span>
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="w-48 h-48 mx-auto mb-4">
          <AbilityRadarChart scores={scores} />
        </div>

        {/* 六维数据 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: '专业力', value: scores.craft },
            { label: '学习力', value: scores.learn },
            { label: '自驱力', value: scores.drive },
            { label: '协作力', value: scores.team },
            { label: '抗压力', value: scores.grit },
            { label: '表达力', value: scores.express },
          ].map((item) => (
            <div key={item.label} className="text-center py-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 统计 */}
        <div className="flex justify-around text-center py-3 border-t border-slate-100">
          <div>
            <p className="text-lg font-bold text-slate-800">{projectCount}</p>
            <p className="text-xs text-slate-500">项目</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">{growthCount}</p>
            <p className="text-xs text-slate-500">成长记录</p>
          </div>
        </div>

        {/* 底部标识 */}
        <div className="text-center mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            履程 · 能力平权，公平展示
          </p>
          <p className="text-xs text-slate-300 mt-1">
            lvcheng.app
          </p>
        </div>
      </div>

      {/* 下载按钮 */}
      <button
        onClick={handleDownload}
        className="w-full py-3 bg-green-900 text-white rounded-lg hover:bg-green-800 transition font-medium text-sm"
      >
        保存为图片
      </button>
    </div>
  );
}
