import Link from 'next/link';

export const metadata = {
  title: 'Cookie 政策 - 履程',
  description: '履程平台 Cookie 使用说明，了解我们如何使用 Cookie 及您的选择权利。',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-[#4A3728] hover:text-[#6B4E3D] text-sm mb-8 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cookie 政策</h1>
        <p className="text-slate-500 mb-10">最后更新：2026年7月15日</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 什么是 Cookie</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Cookie 是小型文本文件，当您访问网站时，网站会将其存储在您的设备上。
            Cookie 可以帮助网站记住您的偏好设置、登录状态等信息，提升您的使用体验。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 我们如何使用 Cookie</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            履程使用以下类型的 Cookie：
          </p>
          <ul className="text-slate-600 leading-relaxed mb-4 list-disc pl-6 space-y-2">
            <li><strong>必要 Cookie：</strong>用于维持基本功能，如登录状态、会话管理。禁用这些 Cookie 可能导致部分功能无法使用。</li>
            <li><strong>偏好 Cookie：</strong>用于记住您的偏好设置，如语言、布局等。</li>
            <li><strong>分析 Cookie：</strong>用于收集匿名化的使用数据，帮助我们优化产品体验。</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 第三方 Cookie</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            我们可能使用第三方服务来提供分析或广告功能，这些服务可能会设置自己的 Cookie。
            这些第三方 Cookie 的使用受其自身隐私政策约束。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 您的选择</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            您可以通过浏览器设置管理或禁用 Cookie。不同浏览器的设置方法可能不同，
            通常在&#34;设置&#34;或&#34;隐私&#34;选项中可以找到相关设置。
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            请注意，禁用某些 Cookie 可能会影响您使用履程的部分功能。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Cookie 更新</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            本 Cookie 政策可能会随着服务更新而调整。我们会在必要时通知您重大变更。
          </p>

          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. 联系我们</h2>
          <p className="text-slate-600 leading-relaxed">
            如对 Cookie 政策有任何疑问，请通过平台内反馈功能与我们联系。
          </p>
        </div>
      </div>
    </div>
  );
}