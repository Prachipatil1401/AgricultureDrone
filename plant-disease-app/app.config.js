const dotenv = require('dotenv');
dotenv.config();

module.exports = ({ config }) => ({
  expo: {
    name: 'PlantDisease',
    slug: 'plant-disease-app',
    scheme: 'plantdisease',
    version: '1.0.0',
    orientation: 'portrait',
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true },
    android: {},
    web: { bundler: 'metro' },
    extra: {
      ROBOFLOW_MODEL: process.env.EXPO_PUBLIC_ROBOFLOW_MODEL || 'your-workspace/your-model',
      ROBOFLOW_VERSION: process.env.EXPO_PUBLIC_ROBOFLOW_VERSION || '1',
      ROBOFLOW_API_KEY: process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || ''
    }
  }
});
