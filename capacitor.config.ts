import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.perfectedge.anglefinder',
  appName: 'Perfect Edge',
  webDir: 'dist/public',
  backgroundColor: '#14110f',
  ios: {
    contentInset: 'always',
    backgroundColor: '#14110f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#14110f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#14110f',
      overlaysWebView: false,
    },
  },
};

export default config;
