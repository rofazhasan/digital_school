import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const config: CapacitorConfig = {
  appId: 'dev.rofazacademy.app',
  appName: 'Rofaz Academy',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://rofazacademy.dev',
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
