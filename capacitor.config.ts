import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.numa.financeiro',
  appName: 'Numa Gestão Financeira',
  webDir: 'out',
  server: {
    // In development, load from Next.js dev server
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://localhost:3000',
      cleartext: true,
    }),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1B3B34',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: 'numaapp',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
