import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { SWRegister } from "@/components/sw-register";

const TITLE = "Crew Up — 알바 출퇴근·근로계약·급여 관리";
const DESC = "출근부터 급여까지, 우리 가게 크루를 한 팀으로.";

export const metadata: Metadata = {
  metadataBase: new URL("https://crewup.kr"),
  title: TITLE,
  description: DESC,
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
  openGraph: {
    type: "website",
    siteName: "Crew Up",
    title: TITLE,
    description: DESC,
    url: "https://crewup.kr",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Crew Up" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og.png"],
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
