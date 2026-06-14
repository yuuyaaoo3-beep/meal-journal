import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import PwaRegister from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Meal Journal",
  description: "あなたの食事を、やさしく管理する",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meal Journal",
  },
  icons: {
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7A9471",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8F4ED]">
        <PwaRegister />
        {children}
        <Navbar />
      </body>
    </html>
  );
}