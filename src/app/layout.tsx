import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const socialImageUrl = "https://raw.githubusercontent.com/13680905763/maoge-mibt/main/public/og.png";

export const metadata: Metadata = {
  title: "猫格 MIBT｜测测你家猫的性格",
  description: "通过日常行为观察，了解猫咪的四维性格倾向，获得专属猫格、相处建议和可分享结果海报。",
  keywords: ["猫咪性格测试", "猫咪 MBTI", "猫格", "MIBT", "宠物性格测试"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "猫格 MIBT｜测测你家猫的性格",
    description: "从日常行为看懂它，获得 16 种专属猫格、相处建议和结果海报。",
    images: [{ url: socialImageUrl, width: 1728, height: 904, alt: "猫格 MIBT 猫咪性格测试" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "猫格 MIBT｜测测你家猫的性格",
    description: "从日常行为看懂它，获得专属猫格和相处建议。",
    images: [socialImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsScriptUrl = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;
  const analyticsWebsiteId = process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID;

  return (
    <html lang="zh-CN">
      <body>
        {children}
        {analyticsScriptUrl && analyticsWebsiteId && (
          <Script
            defer
            src={analyticsScriptUrl}
            data-website-id={analyticsWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
