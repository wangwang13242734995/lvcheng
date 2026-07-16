import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const isProduction = process.env.NODE_ENV === 'production';

function WechatProvider(options: { clientId: string; clientSecret: string }) {
  return {
    id: 'wechat',
    name: '微信',
    type: 'oauth' as const,
    authorization: {
      url: 'https://open.weixin.qq.com/connect/qrconnect',
      params: {
        appid: options.clientId,
        scope: 'snsapi_login',
        response_type: 'code',
      },
    },
    token: {
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      params: {
        appid: options.clientId,
        secret: options.clientSecret,
        grant_type: 'authorization_code',
      },
    },
    userinfo: {
      url: 'https://api.weixin.qq.com/sns/userinfo',
      params: {
        lang: 'zh_CN',
      },
    },
    profile(profile: any) {
      return {
        id: profile.openid,
        name: profile.nickname,
        email: null,
        image: profile.headimgurl,
      };
    },
    options,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: '手机号', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('请输入手机号和密码');
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          throw new Error('该手机号未注册');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('密码错误');
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    WechatProvider({
      clientId: process.env.WECHAT_CLIENT_ID || '',
      clientSecret: process.env.WECHAT_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (account?.provider === 'wechat' && user.name) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: user.email || undefined },
              { name: user.name },
            ],
          },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name,
              email: user.email || `${user.id}@wechat.com`,
              password: '',
              role: 'STUDENT',
              avatar: user.image || null,
              bio: null,
              skills: '[]',
              major: null,
              graduationYear: null,
            },
          });
        }
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: isProduction,
  cookies: isProduction
    ? undefined
    : {
        sessionToken: {
          name: 'next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
          },
        },
        callbackUrl: {
          name: 'next-auth.callback-url',
          options: {
            sameSite: 'lax',
            path: '/',
            secure: false,
          },
        },
        csrfToken: {
          name: 'next-auth.csrf-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
          },
        },
      },
};
