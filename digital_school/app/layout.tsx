import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Tiro_Bangla } from "next/font/google"; // Import Tiro_Bangla
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NavigationWrapper } from "@/components/ui/navigation-wrapper";
import Script from "next/script";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono', // CSS variable for Tailwind
});
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} ${tiroBangla.variable}`}>
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
