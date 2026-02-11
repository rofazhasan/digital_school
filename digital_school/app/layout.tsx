import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Tiro_Bangla, Outfit, Hind_Siliguri, Baloo_Da_2 } from "next/font/google"; // Added Baloo_Da_2
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NavigationWrapper } from "@/components/ui/navigation-wrapper";
import Script from "next/script";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import SessionGuard from "@/components/SessionGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});
// Removed EB Garamond as per user request for better readability. Using Inter (standard sans-serif) instead.

const tiroBangla = Tiro_Bangla({
  weight: '400',
  subsets: ['bengali'],
  variable: '--font-tiro-bangla',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

const balooDa2 = Baloo_Da_2({
  subsets: ['bengali'],
  variable: '--font-baloo',
  display: 'swap',
});


import { AppFooter } from "@/components/AppFooter";
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
      </head>
      <body className={`${inter.className} ${inter.variable} ${tiroBangla.variable} ${outfit.variable} ${hindSiliguri.variable} ${balooDa2.variable} overflow-x-hidden flex flex-col min-h-screen`}>
        <ErrorBoundary>
          <SessionProviderWrapper>
            <NavigationWrapper>
              <MaintenanceGuard>
                <SessionGuard />
                <main className="flex-grow">
                  {children}
                </main>
                <AppFooter />
                <Toaster />
              </MaintenanceGuard>
            </NavigationWrapper>
          </SessionProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
