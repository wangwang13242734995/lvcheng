import Link from 'next/link';

export const metadata = {
  title: '服务条款 - 履程',
  description: '履程平台服务条款，使用本平台前请仔细阅读以下条款。',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-green-900 hover:text-green-800 text-sm mb-8 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">服务条款</h1>
        <p className="text-slate-500 mb-10">最后更新：2026年7月</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 服务说明</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            履程是一个能力展示与成长记录平台，帮助用户记录项目经历、生成能力画像、展示成长轨迹。
            企业用户可以发布挑战赛、发现人才。平台提供的服务包括但不限于：成长档案管理、能力评估、
            企业挑战赛、人才匹配等。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 账号注册与使用</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            注册账号时，您需要提供真实、准确的信息。您对账号下的所有活动负责，
            应妥善保管账号密码。如发现未经授权的使用，请立即通知我们。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们保留在发现违规行为时暂停或终止账号的权利。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 用户内容</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            您对在平台上发布的内容（包括项目经历、成长记录、作品链接等）保留全部权利。
            同时，您授予平台使用、展示、传播这些内容的权限，用于提供和改进服务。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            您承诺发布的内容不违反法律法规，不侵犯他人权益。对于虚假信息、
            抄袭内容等行为，平台有权删除并采取相应措施。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 能力评估说明</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            平台提供的能力评分、雷达图、成长分析等结果由算法自动生成，仅供参考。
            我们会尽力保证算法的公正性和准确性，但不对评估结果的绝对准确性做出保证。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业用户在使用平台数据进行招聘决策时，应结合多方面信息综合判断。
            平台不对招聘结果承担责任。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. 企业挑战赛</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            企业发布的挑战赛由企业自行负责题目设置、评审、奖励发放等事宜。
            平台提供技术支持和展示渠道，但不对挑战赛的具体内容和结果承担责任。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            参赛者应遵守挑战赛规则，独立完成作品。如有作弊、抄袭等行为，
            平台有权取消参赛资格并记录在案。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. 禁止行为</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            使用本平台时，禁止以下行为：
          </p>
          <ul className="text-slate-600 leading-relaxed mb-4 list-disc pl-6 space-y-2">
            <li>发布虚假、欺诈性内容</li>
            <li>抄袭、盗用他人作品或经历</li>
            <li>刷分、刷记录等数据作弊行为</li>
            <li>恶意攻击、骚扰其他用户</li>
            <li>利用平台漏洞进行不当操作</li>
            <li>违反法律法规的其他行为</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. 服务变更与终止</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们可能会不时更新或调整平台功能。对于重大变更，我们会提前通知用户。
            如因不可抗力等原因导致服务中断，平台不承担责任。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. 免责声明</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            平台按"现状"提供服务，不对服务的适用性、可靠性做出明示或暗示的保证。
            在法律允许的最大范围内，平台不对任何间接、附带、特殊损失承担责任。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">9. 条款修改</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们可能会不时修改本服务条款。修改后的条款会在平台上公布，
            继续使用平台即表示您同意修改后的条款。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">10. 联系我们</h2>
          <p className="text-slate-600 leading-relaxed">
            如对服务条款有任何疑问，请通过平台内反馈功能与我们联系。
          </p>
        </div>
      </div>
    </div>
  );
}
