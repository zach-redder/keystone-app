import Constants from 'expo-constants';

if (!Constants.expoConfig?.extra?.apiUrl) {
  throw new Error('Missing API URL configuration. Please check your app.config.js');
}

export const BASE_URL = Constants.expoConfig.extra.apiUrl;