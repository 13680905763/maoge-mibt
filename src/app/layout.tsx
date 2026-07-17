import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIBT | 猫咪性格测试",
  description: "通过日常观察，了解你家猫咪的 MIBT 性格倾向。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
