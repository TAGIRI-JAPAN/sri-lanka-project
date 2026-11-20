import type { Metadata } from "next";
import "./globals.css";
import { PROJECT_TITLE } from "@/lib/project";

export const metadata: Metadata = {
  title: PROJECT_TITLE,
  description: "日本とスリランカの時間を並べて、メンバーで日程を提案・回答するボード。",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: PROJECT_TITLE,
    description: "日本とスリランカの時間を並べて、メンバーで日程を調整。",
    images: [{ url: "/project/island/share-preview.jpg", width: 1200, height: 630 }],
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja" suppressHydrationWarning><body>{children}</body></html>;
}
