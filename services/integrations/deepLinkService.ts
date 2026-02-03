import { Linking } from 'react-native';
import { trackReferralDownload } from './referralService';

// Handle deep links when app is opened
export const handleDeepLink = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const referralCode = urlObj.searchParams.get('ref');
    
    if (referralCode) {
      console.log('Referral code detected:', referralCode);
      await trackReferralDownload(referralCode);
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};

// Set up deep link listener
export const setupDeepLinkListener = () => {
  const handleUrl = (url: string) => {
    handleDeepLink(url);
  };

  // Handle initial URL if app was opened via deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleUrl(url);
    }
  });

  // Listen for deep links when app is already open
  const subscription = Linking.addEventListener('url', (event) => {
    handleUrl(event.url);
  });

  return subscription;
}; 