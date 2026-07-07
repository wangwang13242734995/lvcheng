'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [stats, setStats] = useState({ userCount: 0, projectCount: 0, recordCount: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="text-sm font-medium tracking-widest text-orange-600 uppercase mb-4">
          能力平权 · 公平展示
        </p>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          你的作品，<br className="sm:hidden" />
          <span className="text-orange-600">比文凭更有说服力</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          别人凭什么判断你厉不厉害？不是证书，不是背书——是你做过什么、解决了什么、成长了多少。
          履程把你的真实能力变成看得见的数据——不靠标签，靠作品。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-green-900 text-white px-8 py-3.5 rounded-lg text-lg font-medium hover:bg-green-800 transition"
          >
            用作品证明自己
          </Link>
          <Link
            href="/auth/login"
            className="border border-slate-200 text-slate-700 px-8 py-3.5 rounded-lg text-lg font-medium hover:bg-slate-50 transition"
          >
            登录
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{stats.userCount}</p>
              <p className="text-xs text-slate-400 mt-1">用作品说话的人</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{stats.projectCount}</p>
              <p className="text-xs text-slate-400 mt-1">被记录的作品</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{stats.recordCount}</p>
              <p className="text-xs text-slate-400 mt-1">可见的成长</p>
            </div>
          </div>
        </div>
      </section>

      {/* 痛点 + 解法 */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            一张纸，装不下真实的你
          </h2>
          <p className="text-center text-slate-500 mb-16 max-w-2xl mx-auto leading-relaxed">
            传统筛选看标签，面试看印象，第一份工作还是看关系。<br />
            但你明明知道——真正让你与众不同的，是你熬过的夜、解过的难题、做过的项目。
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                数据替你说话
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                六维能力模型不是别人给你打分——是你的项目数量、困难复杂度、成长斜率自动算出来的。
                <strong className="text-slate-700">你的专业力是42还是78，不取决于谁的印象，取决于你做了什么。</strong>
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                作品可以验证
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                每个项目都带着证据——代码链接、上线产品、获奖证明、量化数据。
                <strong className="text-slate-700">不是你说你厉害，是你的作品证明你厉害。</strong>
                这是简历做不到的。
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                成长看得见
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                你的能力不是一天练成的，但简历上只有一个结果。
                <strong className="text-slate-700">履程记录的是过程——从30分到70分的成长轨迹，比任何证书都有说服力。</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 对比区 */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            简历 vs 履程
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 简历 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-400 mb-4 text-sm uppercase tracking-wider">传统简历</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">✕</span>
                  <span>标签和头衔排在最前面</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">✕</span>
                  <span>项目经历只有一行描述</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">✕</span>
                  <span>无法证明你说的是真的</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">✕</span>
                  <span>看不到你的成长过程</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">✕</span>
                  <span>所有人格式一样，无法区分</span>
                </li>
              </ul>
            </div>
            {/* 履程 */}
            <div className="p-6 rounded-xl border border-green-200 bg-green-50/30">
              <h3 className="font-semibold text-green-700 mb-4 text-sm uppercase tracking-wider">履程名片</h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>能力分数</strong>排在最前面，出身只字不提</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>每个项目有<strong>困难+解决+成果</strong>完整故事</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>代码链接、量化数据、获奖证明<strong>可验证</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>六维雷达图展示<strong>成长轨迹</strong>和斜率</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>每个人的名片都是<strong>独一无二</strong>的能力画像</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            2分钟，让能力替你说话
          </h2>
          <p className="text-center text-slate-500 mb-12">
            不需要写简历，不需要编故事。你只需要记录你做过的事。
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-14 h-14 bg-green-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">注册</h3>
              <p className="text-sm text-slate-500">30秒，填个名字就行</p>
            </div>
            <div>
              <div className="w-14 h-14 bg-green-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">记录一个项目</h3>
              <p className="text-sm text-slate-500">做了什么、遇到什么困难、怎么解决的</p>
            </div>
            <div>
              <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">拿到你的名片</h3>
              <p className="text-sm text-slate-500">六维雷达图自动生成，分享出去</p>
            </div>
          </div>
        </div>
      </section>

      {/* 挑战广场入口 */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-16 -translate-x-16" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">⚔️</span>
                  <span className="text-green-200/80 text-sm font-medium">企业真实问题</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  用能力接招，不用简历敲门
                </h2>
                <p className="text-green-200/70 leading-relaxed mb-6">
                  字节、腾讯、小红书发布真实挑战。不筛学历，只看你的六维能力。完成挑战获得企业认证，让能力直接变现。
                </p>
                <Link
                  href="/challenges"
                  className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-400 transition"
                >
                  浏览挑战广场 →
                </Link>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 text-center">
                  <p className="text-2xl font-bold text-white">5+</p>
                  <p className="text-xs text-green-200/70">开放挑战</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 text-center">
                  <p className="text-2xl font-bold text-orange-400">¥16,000+</p>
                  <p className="text-xs text-green-200/70">累计奖金</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 text-center">
                  <p className="text-2xl font-bold text-white">103</p>
                  <p className="text-xs text-green-200/70">总名额</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            别让标签定义你
          </h2>
          <p className="text-green-100/70 mb-8 max-w-lg mx-auto">
            有人什么都做过，有人什么都没做过。区别不在出身，在于你做了什么。
            <br />在这里，作品说了算。
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-orange-500 text-white px-8 py-3.5 rounded-lg text-lg font-semibold hover:bg-orange-400 transition"
          >
            用作品证明自己 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 履程 · 作品胜过文凭</p>
        </div>
      </footer>
    </div>
  );
}
