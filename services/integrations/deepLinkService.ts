import { trackReferralDownload } from '../user/referralService';

// Called from app/_layout.js's central deep-link listener when a keystone://...?ref=CODE
// link is received. Not a standalone listener itself -- _layout.js owns the single
// Linking subscription for the whole app.
export const handleReferralDeepLink = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const referralCode = urlObj.searchParams.get('ref');

    if (referralCode) {
      console.log('Referral code detected in deep link:', referralCode);
      await trackReferralDownload(referralCode);
    }
  } catch (error) {
    console.error('Error handling referral deep link:', error);
  }
};
