import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NavigationWrapper } from "@/components/ui/navigation-wrapper";
import Script from "next/script";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital School",
  description: "A comprehensive digital school management system",
};

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
      <body className={inter.className}>
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
