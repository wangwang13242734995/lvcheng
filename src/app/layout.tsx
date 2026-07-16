import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import WebVitalsMonitor from "@/components/WebVitalsMonitor";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "履程 · 能力平权，公平展示",
  description: "不看出身，只看能力。六维能力模型量化你的真实实力，用作品说话的能力展示平台。",
  keywords: "能力展示,作品证明,六维能力,人才招聘,项目展示,成长记录,挑战",
  authors: [{ name: "履程团队" }],
  creator: "履程",
  publisher: "履程",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://lvcheng.site",
  },
  openGraph: {
    title: "履程 · 能力平权，公平展示",
    description: "不看出身，只看能力。六维能力模型量化你的真实实力，用作品说话的能力展示平台。",
    type: "website",
    siteName: "履程",
    images: [
      {
        url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20professional%20social%20profile%20sharing%20card%20with%20radar%20chart%20and%20ability%20scores%20green%20theme&image_size=landscape_16_9",
        width: 1200,
        height: 630,
        alt: "履程能力名片",
      },
    ],
    url: "https://lvcheng.site",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "履程 · 能力平权，公平展示",
    description: "不看出身，只看能力。六维能力模型量化你的真实实力。",
    images: [
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20professional%20social%20profile%20sharing%20card%20with%20radar%20chart%20and%20ability%20scores%20green%20theme&image_size=landscape_16_9",
    ],
    site: "@lvcheng",
    creator: "@lvcheng",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="font-sans">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <Providers>
          <WebVitalsMonitor />
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
