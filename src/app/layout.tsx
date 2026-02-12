import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "聊天应用",
  description: "实时聊天应用，支持 Telegram 文件存储",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
