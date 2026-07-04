import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="text-sm font-medium tracking-widest text-amber-600 uppercase mb-4">
          能力平权 · 公平展示
        </p>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          不看出身，<br className="sm:hidden" />
          <span className="text-amber-600">只看能力</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          每一次项目实践，都是能力的积累。履程用六维能力模型，
          把你的真实实力变成可量化、可展示、可验证的资产。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-slate-800 text-white px-8 py-3.5 rounded-lg text-lg font-medium hover:bg-slate-700 transition"
          >
            免费开始
          </Link>
          <Link
            href="/auth/login"
            className="border border-slate-200 text-slate-700 px-8 py-3.5 rounded-lg text-lg font-medium hover:bg-slate-50 transition"
          >
            登录
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            为什么选择履程？
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            不是简历工具，不是项目管理器。是你的能力成长银行。
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">六维能力模型</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                专业力、学习力、自驱力、协作力、抗压力、表达力。不是别人给你打分，是数据替你说话。
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">结构化记录</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                课程作业、比赛、实习、个人项目。不只记录做了什么，更记录你怎么克服困难的。
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center mb-5">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">成长可视化</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                雷达图、时间线、成长斜率。生成可分享的能力名片，让进步被看见。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            两步开始
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">注册账号</h3>
              <p className="text-sm text-slate-500">30秒完成，无需信用卡</p>
            </div>
            <div>
              <div className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">记录项目</h3>
              <p className="text-sm text-slate-500">结构化记录，自动生成能力画像</p>
            </div>
            <div>
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">分享名片</h3>
              <p className="text-sm text-slate-500">让能力替你说话，不靠学历背书</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            你的能力，值得被看见
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            不管你在哪个学校，不管你是什么背景。用数据证明自己的实力。
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-amber-500 text-slate-900 px-8 py-3.5 rounded-lg text-lg font-semibold hover:bg-amber-400 transition"
          >
            立即开始 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 履程 · 能力平权，公平展示</p>
        </div>
      </footer>
    </div>
  );
}
