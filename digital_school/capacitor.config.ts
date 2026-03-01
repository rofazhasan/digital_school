import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const config: CapacitorConfig = {
  appId: 'com.examify.app',
  appName: 'Examify',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://digitalsch.netlify.app',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#3b82f6",
    },
  },
};

export default config;
