import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('SMTP not configured, skipping email send', { to: options.to, subject: options.subject });
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"履程" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    });

    logger.info('Email sent successfully', { to: options.to, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : String(error),
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #14532D 0%, #166534 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">履程</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">能力平权 · 公平展示</p>
      </div>
      
      <div style="background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 18px;">重置密码</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px;">
          你正在重置履程账号的密码。如果这不是你本人的操作，请忽略此邮件。
        </p>
        <div style="margin-bottom: 20px;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #14532D 0%, #166534 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            立即重置密码
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          链接有效期为1小时。如果链接无法点击，请复制以下地址到浏览器中打开：
        </p>
        <p style="color: #64748b; font-size: 14px; word-break: break-all; margin: 8px 0 0;">
          ${resetUrl}
        </p>
      </div>
      
      <p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 20px 0 0;">
        © 2026 履程. 用作品证明能力
      </p>
    </div>
  `;

  return sendEmail({ to, subject: '履程 - 重置密码', html });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #14532D 0%, #166534 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">履程</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">能力平权 · 公平展示</p>
      </div>
      
      <div style="background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #14532D 0%, #166534 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; color: white;">
            ${name.charAt(0)}
          </div>
          <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px;">欢迎加入履程，${name}！</h2>
          <p style="color: #64748b; margin: 0;">用作品证明你的真实能力</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 16px;">下一步建议</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 2;">
            <li>记录你的第一个项目</li>
            <li>完善个人资料和技能标签</li>
            <li>探索挑战广场，寻找成长机会</li>
          </ul>
        </div>
        
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; text-align: center; background: linear-gradient(135deg, #14532D 0%, #166534 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          开始探索
        </a>
      </div>
      
      <p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 20px 0 0;">
        © 2026 履程. 用作品证明能力
      </p>
    </div>
  `;

  return sendEmail({ to, subject: '欢迎加入履程', html });
}

export async function sendSubmissionResultEmail(
  to: string,
  name: string,
  challengeTitle: string,
  status: string,
  comment?: string
) {
  const isApproved = status === 'ACCEPTED' || status === 'APPROVED';
  const title = isApproved ? '恭喜！你的提交已通过评审' : '你的提交评审结果';
  const bgColor = isApproved ? '#16A34A' : '#EA580C';

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${isApproved ? '#15803D' : '#C2410C'} 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 12px;">${isApproved ? '🎉' : '💪'}</div>
        <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      
      <div style="background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <div style="margin-bottom: 20px;">
          <p style="color: #64748b; margin: 0 0 8px;">挑战名称</p>
          <h2 style="color: #1e293b; margin: 0; font-size: 18px;">${challengeTitle}</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #64748b; margin: 0 0 8px;">评审结果</p>
          <p style="color: ${isApproved ? '#16A34A' : '#EA580C'}; font-size: 18px; font-weight: 600;">${isApproved ? '通过' : '未通过'}</p>
        </div>
        
        ${comment ? `
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="color: #64748b; margin: 0 0 8px;">评审意见</p>
            <p style="color: #1e293b; margin: 0; line-height: 1.6;">${comment}</p>
          </div>
        ` : ''}
        
        ${isApproved ? `
          <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px;">
            你的能力雷达图已更新，快去看看你的进步吧！
          </p>
          <a href="${process.env.NEXTAUTH_URL}/profile/ability" style="display: block; text-align: center; background: linear-gradient(135deg, #14532D 0%, #166534 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            查看能力雷达图
          </a>
        ` : `
          <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px;">
            不要气馁，继续努力提升自己。你可以修改后重新提交，或者尝试其他挑战。
          </p>
          <a href="${process.env.NEXTAUTH_URL}/challenges" style="display: block; text-align: center; background: linear-gradient(135deg, #14532D 0%, #166534 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            探索更多挑战
          </a>
        `}
      </div>
      
      <p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 20px 0 0;">
        © 2026 履程. 用作品证明能力
      </p>
    </div>
  `;

  return sendEmail({ to, subject: title, html });
}
