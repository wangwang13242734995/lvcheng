'use client';

import { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import AbilityRadarChart from './AbilityRadarChart';
import { ABILITY_TOTAL_BASE_SCORE } from '@/lib/ability-constants';

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
  userId?: string;
}

const SHARE_CONFIG = [
  { id: 'wechat', label: '微信', icon: '💬', color: 'bg-[#4A6B43]', shareUrl: '/api/share/wechat' },
  { id: 'weibo', label: '微博', icon: '📢', color: 'bg-red-600', shareUrl: '/api/share/weibo' },
  { id: 'qq', label: 'QQ', icon: '🐧', color: 'bg-blue-600', shareUrl: '/api/share/qq' },
];

export default function ShareCard({ userName, scores, projectCount, growthCount, userId }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = userId 
    ? `${window.location.origin}/profile/${userId}`
    : `${window.location.origin}/dashboard`;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  }, [userName]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [shareUrl]);

  const handleShare = useCallback((platform: string) => {
    const shareText = `${userName} 在履程的能力得分：${scores.totalScore || ABILITY_TOTAL_BASE_SCORE}分\n查看六维能力雷达图：${shareUrl}`;
    
    switch (platform) {
      case 'weibo':
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}&language=zh_cn`;
        window.open(weiboUrl, '_blank', 'width=600,height=400');
        break;
      case 'qq':
        const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}&summary=${encodeURIComponent(shareText)}`;
        window.open(qqUrl, '_blank', 'width=600,height=400');
        break;
      case 'wechat':
        setShowQR(true);
        break;
    }
  }, [userName, scores.totalScore, shareUrl]);

  return (
    <div className="space-y-4">
      {/* 可导出的卡片 */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-white via-slate-50 to-[#F7FAF6] p-8 rounded-3xl border border-slate-100 shadow-lg max-w-sm mx-auto relative overflow-hidden"
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D6E4D2]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7A9A75] to-[#4A3728] rounded-2xl flex items-center justify-center text-2xl text-white font-bold shadow-lg">
            {userName?.[0] || '?'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{userName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {scores.totalScore || ABILITY_TOTAL_BASE_SCORE}
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">综合得分</span>
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="w-52 h-52 mx-auto mb-5 relative z-10">
          <AbilityRadarChart scores={scores} />
        </div>

        {/* 六维数据 */}
        <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
          {[
            { label: '专业力', value: scores.craft, color: 'text-blue-600' },
            { label: '学习力', value: scores.learn, color: 'text-[#4A6B43]' },
            { label: '自驱力', value: scores.drive, color: 'text-amber-600' },
            { label: '协作力', value: scores.team, color: 'text-purple-600' },
            { label: '抗压力', value: scores.grit, color: 'text-red-600' },
            { label: '表达力', value: scores.express, color: 'text-pink-600' },
          ].map((item) => (
            <div key={item.label} className="text-center py-3 bg-white/60 backdrop-blur rounded-xl border border-slate-100">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 统计 */}
        <div className="flex justify-around text-center py-4 bg-white/50 backdrop-blur rounded-xl border border-slate-100 relative z-10">
          <div>
            <p className="text-2xl font-bold text-slate-800">{projectCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">已发布项目</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">{growthCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">成长记录</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-amber-600">{Math.round((scores.totalScore || ABILITY_TOTAL_BASE_SCORE) / 20)}</p>
            <p className="text-xs text-slate-500 mt-0.5">能力等级</p>
          </div>
        </div>

        {/* 底部标识 */}
        <div className="text-center mt-5 pt-4 border-t border-slate-200/50 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-6 h-6 bg-gradient-to-br from-[#4A6B43] to-[#6B4E3D] rounded-lg flex items-center justify-center text-xs text-white font-bold">LC</span>
            <span className="text-xs font-semibold text-slate-700">履程</span>
          </div>
          <p className="text-xs text-slate-400">能力平权，公平展示</p>
          <p className="text-xs text-slate-300 mt-0.5">{window.location.hostname}</p>
        </div>
      </div>

      {/* 分享操作按钮 */}
      <div className="space-y-3">
        {/* 社交分享 */}
        <div className="grid grid-cols-4 gap-2">
          {SHARE_CONFIG.map((item) => (
            <button
              key={item.id}
              onClick={() => handleShare(item.id)}
              className={`${item.color} text-white py-2.5 rounded-xl flex flex-col items-center gap-1 hover:opacity-90 transition`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleCopyLink}
            className="bg-slate-700 text-white py-2.5 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-800 transition"
          >
            <span className="text-lg">{copied ? '✓' : '🔗'}</span>
            <span className="text-xs font-medium">{copied ? '已复制' : '复制链接'}</span>
          </button>
        </div>

        {/* 下载图片 */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3 bg-gradient-to-r from-[#6B4E3D] to-[#3D5A37] text-white rounded-xl hover:from-[#4A3728] hover:to-[#6B4E3D] transition font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <span>📸</span>
              保存为图片分享
            </>
          )}
        </button>
      </div>

      {/* 微信分享二维码弹窗 */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-4">扫码分享到微信</h3>
            <p className="text-sm text-slate-500 mb-4">使用微信扫一扫，分享给好友</p>
            
            {/* 简化的二维码展示（实际项目中可以使用 qrcode 库生成） */}
            <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-4 border-4 border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-400">扫描此码</p>
                <p className="text-xs text-slate-300 mt-1">查看能力名片</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 break-all">{shareUrl}</p>
            
            <button
              onClick={() => setShowQR(false)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
