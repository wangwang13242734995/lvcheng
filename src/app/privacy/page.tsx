import Link from 'next/link';

export const metadata = {
  title: '隐私政策 - 履程',
  description: '履程平台隐私政策，了解我们如何收集、使用和保护您的个人信息。',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-green-900 hover:text-green-800 text-sm mb-8 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">隐私政策</h1>
        <p className="text-slate-500 mb-10">最后更新：2026年7月</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 我们收集什么信息</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            当您注册履程账号时，我们会收集您提供的基本信息，包括姓名、邮箱、密码。
            您还可以选择填写专业方向、预计入职年份等信息，用于生成您的能力名片。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            在使用过程中，我们会收集您主动记录的项目经历、技能、成长笔记等内容。
            这些内容构成您的能力档案，是平台的核心价值所在。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 我们如何使用您的信息</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>核心用途：</strong>基于您记录的项目和经历，自动计算能力评分，生成能力雷达图和名片，供您展示给企业或他人。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>企业匹配：</strong>如果您报名参加企业挑战赛，企业可以看到您的能力名片和提交的作品。
            除此之外，企业无法随意浏览您的个人数据。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>产品改进：</strong>我们会使用匿名化的统计数据优化产品体验，但不会将您的个人信息用于其他目的。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 信息公开与分享</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            您的能力名片（包含项目展示、雷达图、技能标签）可以通过您主动分享的链接被他人查看。
            您的邮箱、密码、未公开的项目细节等敏感信息不会公开。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们不会出售您的个人信息。除非法律要求，否则不会向第三方披露您的个人数据。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 数据安全</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们使用行业标准的安全措施保护您的数据，包括密码加密存储、HTTPS 传输、数据库访问控制等。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            虽然我们采取了合理的安全措施，但互联网上没有绝对安全的数据传输方式，我们无法保证绝对安全。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. 您的权利</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            您有权随时查看、修改、删除您的个人信息和项目记录。您也可以申请注销账号，我们会在合理时间内删除您的数据。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Cookie 的使用</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们使用 Cookie 和类似技术来维持您的登录状态、记住您的偏好设置。您可以在浏览器设置中禁用 Cookie，但这可能影响部分功能的使用。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. 政策变更</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们可能会不时更新本隐私政策。重大变更会通过站内通知或邮件告知您。继续使用平台即表示您同意更新后的政策。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. 联系我们</h2>
          <p className="text-slate-600 leading-relaxed">
            如果您对隐私政策有任何疑问，请通过平台内反馈或发送邮件与我们联系。
          </p>
        </div>
      </div>
    </div>
  );
}
