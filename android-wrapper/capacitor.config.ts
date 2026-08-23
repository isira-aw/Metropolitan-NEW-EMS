import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metropolitan.ems',
  appName: 'EMS Portal',
  // TODO: replace with your production URL (e.g. the Railway deployment URL).
  server: {
    url: 'https://REPLACE-WITH-YOUR-PRODUCTION-URL',
    androidScheme: 'https',
  },
};

export default config;
