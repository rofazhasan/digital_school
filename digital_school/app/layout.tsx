import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Tiro_Bangla } from "next/font/google"; // Import Tiro_Bangla
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NavigationWrapper } from "@/components/ui/navigation-wrapper";
import Script from "next/script";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});
// Removed EB Garamond as per user request for better readability. Using Inter (standard sans-serif) instead.

const tiroBangla = Tiro_Bangla({
  weight: '400',
  subsets: ['bengali'],
  variable: '--font-tiro-bangla',
});


import db from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Digital School";
  try {
    const settings = await db.settings.findFirst({
      select: { instituteName: true, institute: { select: { name: true } } }
    });
    title = settings?.instituteName || settings?.institute?.name || "Digital School";
  } catch (error) {
    console.warn("Failed to fetch settings for metadata (likely build time):", error);
  }

  return {
    title: title,
    description: "A comprehensive digital school management system",
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@rod2ik/tikzjax/dist/fonts.css" />
        <Script src="https://cdn.jsdelivr.net/npm/@rod2ik/tikzjax/dist/tikzjax.js" strategy="afterInteractive" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
      </head>
      <body className={`${inter.className} ${inter.variable} ${tiroBangla.variable} overflow-x-hidden`}>
        <ErrorBoundary>
          <SessionProviderWrapper>
            <NavigationWrapper>
              <MaintenanceGuard>
                {children}
                <Toaster />
              </MaintenanceGuard>
            </NavigationWrapper>
          </SessionProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
