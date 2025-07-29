import { Platform } from 'react-native';

// App Store Links
export const APP_STORE_LINKS = {
  iOS: "https://apps.apple.com/app/keystone/id123456789", // Replace with your actual App Store ID
  Android: "https://play.google.com/store/apps/details?id=com.keystone.app", // Replace with your actual package name
};

// Get the appropriate app store link based on platform
export const getAppStoreLink = () => {
  return Platform.OS === 'ios' ? APP_STORE_LINKS.iOS : APP_STORE_LINKS.Android;
};

// Universal link for app download (if you set up a landing page)
export const APP_DOWNLOAD_URL = "https://thekeystoneapp.com/download";

// App name and other constants
export const APP_NAME = "Keystone";
export const APP_TAGLINE = "Overcome Doubt";
export const APP_WEBSITE = "thekeystoneapp.com"; 