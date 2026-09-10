import { Share } from 'react-native';
import { getAppStoreLink } from '../../constants/appStore';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

/**
 * Gets the appropriate store URL for the current platform
 * @returns App store URL for the current platform
 */
export const getStoreUrl = (): string => {
  return getAppStoreLink();
};

/**
 * Shares the Keystone app store URL to trigger rich link preview
 * @param customMessage - Custom message to share (optional)
 * @returns Promise that resolves when share is completed or dismissed
 */
export const shareApp = async (
  customMessage?: string
): Promise<void> => {
  try {
    const storeUrl = getStoreUrl();
    
    const shareOptions: ShareOptions = {
      title: 'Keystone App',
      message: customMessage || '', // Empty message or custom text only
      url: storeUrl, // Always use URL field for the link
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      console.log('App shared successfully');
      if (result.activityType) {
        console.log('Shared via:', result.activityType);
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing app:', error);
    throw error;
  }
};

/**
 * Shares app with a generic message (no specific page)
 */
export const shareAppGeneral = async (): Promise<void> => {
  return shareApp();
};

/**
 * Shares the Keys page specifically - now same as general share
 */
export const shareKeysPage = async (): Promise<void> => {
  return shareApp();
};

/**
 * Shares the Profile page specifically - now same as general share
 */
export const shareProfilePage = async (): Promise<void> => {
  return shareApp();
};

/**
 * Shares the Home page specifically - now same as general share
 */
export const shareHomePage = async (): Promise<void> => {
  return shareApp();
};
