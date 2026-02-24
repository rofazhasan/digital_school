import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Hind_Siliguri, Baloo_Da_2, Tiro_Bangla, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NavigationWrapper } from "@/components/ui/navigation-wrapper";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import SessionGuard from "@/components/SessionGuard";
import { AppFooter } from "@/components/AppFooter";
import db from "@/lib/db";

// --- Fonts ---
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const tiroBangla = Tiro_Bangla({
  weight: '400',
  subsets: ['bengali'],
  variable: '--font-tiro-bangla',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

// const balooDa2 = Baloo_Da_2({
//   subsets: ['bengali'],
//   variable: '--font-baloo',
//   display: 'swap',
// });
const balooDa2 = { variable: '' };

// --- Metadata ---
export async function generateMetadata(): Promise<Metadata> {
  let title = "Examify";
  try {
    const settings = await db.settings.findFirst({
      select: { instituteName: true, institute: { select: { name: true } } }
    });
    title = settings?.instituteName || settings?.institute?.name || "Examify";
  } catch (error) {
    console.warn("Failed to fetch settings for metadata:", error);
  }

  return {
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: "A world-class digital learning platform.",
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true,
  themeColor: "#ffffff",
};

import { ThemeProvider } from "@/components/theme-provider";
import MobileEnhancements from "@/components/MobileEnhancements";
import MobileNavigationControls from "@/components/MobileNavigationControls";

// ... existing imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} ${tiroBangla.variable} ${hindSiliguri.variable} ${balooDa2.variable} font-sans antialiased overflow-x-hidden min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="ds-theme-preference"
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <NavigationWrapper>
              <MobileEnhancements />
              <MobileNavigationControls />
              <MaintenanceGuard>
                <SessionGuard />
                <div className="flex-grow flex flex-col relative w-full max-w-[100vw] animate-in fade-in duration-1000 ease-in-out">
                  {children}
                </div>
                <AppFooter />
                <Toaster />
              </MaintenanceGuard>
            </NavigationWrapper>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
