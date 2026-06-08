import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { SWRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "Crew Up — 알바 출퇴근·급여 관리",
  description: "출근부터 급여까지, 우리 가게 크루를 한 팀으로.",
  manifest: "/manifest.webmanifest",
  applicationName: "Crew Up",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crew Up",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2F6BFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>{children}</SessionProvider>
        <SWRegister />
      </body>
    </html>
  );
}
