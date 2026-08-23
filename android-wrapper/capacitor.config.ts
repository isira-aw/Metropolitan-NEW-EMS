import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metropolitan.ems',
  appName: 'EMS Portal',
  server: {
    url: 'https://metropolitan.up.railway.app',
    androidScheme: 'https',
  },
};

export default config;
