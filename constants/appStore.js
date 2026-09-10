import { Platform } from 'react-native';

// Universal link for app download (marketing site)
export const APP_DOWNLOAD_URL = "https://thekeystoneapp.com";

// App Store Links
export const APP_STORE_LINKS = {
  iOS: "https://apps.apple.com/us/app/keystone-overcome-doubt/id6749184004",
  Android: APP_DOWNLOAD_URL, // Android isn't live yet — falls back to the marketing site. Swap in https://play.google.com/store/apps/details?id=com.reddermedia.keystone once published.
};

// Get the appropriate app store link based on platform
export const getAppStoreLink = () => {
  return Platform.OS === 'ios' ? APP_STORE_LINKS.iOS : APP_STORE_LINKS.Android;
};

// App name and other constants
export const APP_NAME = "Keystone";
export const APP_TAGLINE = "Kill Doubt";
export const APP_WEBSITE = "thekeystoneapp.com";