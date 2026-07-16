import Link from 'next/link';

export const metadata = {
  title: '关于我们 - 履程',
  description: '履程——用作品说话的能力展示平台，让每个人的成长都被看见。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-[#4A3728] hover:text-[#6B4E3D] text-sm mb-8 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">关于履程</h1>
        <p className="text-slate-500 mb-10">让每个人的成长都被看见</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">我们的使命</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            履程相信，一个人的价值不应该由学历、标签、背景来定义，而应该由他做过什么、
            解决了什么问题、成长了多少来证明。我们致力于打造一个公平的能力展示平台，
            让每一个努力成长的人都能被看见。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">为什么是履程</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>传统简历的问题：</strong>每个人都写着&ldquo;学生会主席&rdquo;、&ldquo;绩点 3.8&rdquo;、
            &ldquo;熟练掌握 XX 技术&rdquo;——面试官根本分不清谁真有能力。入职后才发现不匹配，
            试错成本极高。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>履程的解法：</strong>不是看你说自己有多厉害，而是看你实际做了什么。
            通过结构化的项目记录、困难与解决过程、成长轨迹，让能力变得可量化、可验证、
            可对比。过程比结果更有说服力。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">核心价值</h2>
          <div className="grid sm:grid-cols-2 gap-4 my-6">
            <div className="bg-slate-50 p-5 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">📈 过程 ＞ 结果</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                展示你是怎么一步步做到的，比只展示结果更有说服力。
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">🎯 数据 ＞ 自述</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                能力分数由行为数据自动计算，不是自己填的，更有可信度。
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">🌱 成长斜率</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                从 35 分涨到 71 分的轨迹，比一张静态证书更有价值。
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">⚖️ 能力平权</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                不看学校、不看背景，只看能力。每个人都有公平的展示机会。
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">六维能力模型</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们从企业校招的真实需求出发，提炼出评估应届生能力的六个核心维度：
          </p>
          <div className="grid sm:grid-cols-2 gap-3 my-6">
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">C</span>
              <div>
                <p className="font-medium text-slate-900">专业力 Craft</p>
                <p className="text-sm text-slate-500">能不能把事情做好</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">L</span>
              <div>
                <p className="font-medium text-slate-900">学习力 Learn</p>
                <p className="text-sm text-slate-500">能成长多快</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">D</span>
              <div>
                <p className="font-medium text-slate-900">自驱力 Drive</p>
                <p className="text-sm text-slate-500">需不需要人盯着</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">T</span>
              <div>
                <p className="font-medium text-slate-900">协作力 Team</p>
                <p className="text-sm text-slate-500">好不好合作</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">G</span>
              <div>
                <p className="font-medium text-slate-900">抗压力 Grit</p>
                <p className="text-sm text-slate-500">遇到困难会不会放弃</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-8 h-8 bg-[#EDF3EB] text-[#4A3728] rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">E</span>
              <div>
                <p className="font-medium text-slate-900">表达力 Express</p>
                <p className="text-sm text-slate-500">能不能说清楚</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">联系我们</h2>
          <p className="text-slate-600 leading-relaxed">
            如有合作意向、问题反馈或其他需求，欢迎通过平台内反馈功能与我们取得联系。
          </p>
        </div>
      </div>
    </div>
  );
}
