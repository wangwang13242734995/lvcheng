import Link from 'next/link';

export const metadata = {
  title: '企业服务协议 - 履程',
  description: '履程企业用户服务协议，适用于发布挑战赛、人才搜索等企业服务。',
};

export default function EnterpriseTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-[#4A3728] hover:text-[#6B4E3D] text-sm mb-8 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">企业服务协议</h1>
        <p className="text-slate-500 mb-10">最后更新：2026年7月15日</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 协议范围</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            本协议适用于以企业身份注册并使用履程平台服务的用户（以下简称&#34;企业&#34;）。
            企业可以使用的服务包括但不限于：发布挑战赛、查看参赛者信息、人才搜索等。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 企业注册与认证</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业注册时需提供真实、准确的企业信息，包括企业名称、联系人、联系方式等。
            平台有权审核企业资质，对于虚假信息有权拒绝注册或终止服务。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 挑战赛发布规则</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业发布的挑战赛内容应符合法律法规，不得包含违法、低俗或歧视性内容。
            企业应对挑战赛的题目设置、评审标准、奖励发放等事宜负责。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业承诺挑战赛奖励真实有效，并在规定时间内完成发放。如因奖励问题产生纠纷，由企业自行承担责任。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 参赛者信息使用</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业可以查看报名并通过审核的参赛者的能力名片、提交作品等信息。
            这些信息仅用于招聘决策和挑战赛评审，不得用于其他目的。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业不得泄露参赛者的个人敏感信息，包括手机号、邮箱等联系方式，除非获得参赛者明确授权。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. 知识产权</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业发布的挑战赛题目、评审标准等内容的知识产权归企业所有。
            参赛者提交的作品知识产权归参赛者所有，企业仅获得评审和招聘参考的使用权限。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. 禁止行为</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业在使用平台服务时，禁止以下行为：
          </p>
          <ul className="text-slate-600 leading-relaxed mb-4 list-disc pl-6 space-y-2">
            <li>发布虚假挑战赛或虚假奖励信息</li>
            <li>歧视性招聘或评审标准</li>
            <li>滥用参赛者信息进行骚扰或营销</li>
            <li>恶意竞争或破坏平台秩序</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. 服务费用</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            平台当前提供免费服务。如未来推出付费服务，会提前通知企业并另行签订协议。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. 免责声明</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            平台不对企业发布的挑战赛内容承担审核责任。企业应对其发布的信息真实性、合法性负责。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">9. 协议修改</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们可能会不时修改本协议。修改后的协议会在平台上公布，继续使用服务即表示同意修改后的协议。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">10. 联系我们</h2>
          <p className="text-slate-600 leading-relaxed">
            如对企业服务协议有任何疑问，请通过平台内反馈功能与我们联系。
          </p>
        </div>
      </div>
    </div>
  );
}