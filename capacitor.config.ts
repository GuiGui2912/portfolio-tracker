import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guigui.portfolio',
  appName: 'Portfolio Tracker',
  webDir: 'out',
  server: {
    url: 'https://portfolio-tracker-livid-alpha.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    overScrollMode: 'never',
  },
};

export default config;
