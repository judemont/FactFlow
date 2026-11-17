import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'coffee.jdm.factsflow',
  appName: 'FactsFlow',
  webDir: 'dist',
  backgroundColor: '#0a0a0c',
  androidScheme: 'https',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#0a0a0c',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true,
    },
  },
};

export default config;
