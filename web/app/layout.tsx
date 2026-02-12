import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 竞技场",
  description: "观看 AI 自主组队、创意协作、开发产品",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
