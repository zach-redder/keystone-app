import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AiConsentModal from '../components/modals/AiConsentModal';
import { grantAiConsent, hasAiConsent } from '../services/user/aiConsentService';

/**
 * Asks the user to agree to AI data sharing the first time they use an AI feature.
 * `await ensureConsent()` resolves true when they have agreed (now or earlier); render `consentModal`
 * somewhere in the screen. The services check consent again before sending, so this is only the prompt.
 */
export default function useAiConsent() {
  const [visible, setVisible] = useState(false);
  const resolver = useRef(null);

  const settle = useCallback((agreed) => {
    setVisible(false);
    resolver.current?.(agreed);
    resolver.current = null;
  }, []);

  const ensureConsent = useCallback(async () => {
    try {
      if (await hasAiConsent()) return true;
    } catch (e) {
      console.error('Error checking AI consent:', e);
    }
    return new Promise((resolve) => {
      resolver.current = resolve;
      setVisible(true);
    });
  }, []);

  const handleAgree = useCallback(async () => {
    try {
      await grantAiConsent();
      settle(true);
    } catch (e) {
      console.error('Error saving AI consent:', e);
      Alert.alert('Something went wrong', 'Could not save your choice. Please try again.');
    }
  }, [settle]);

  const consentModal = (
    <AiConsentModal visible={visible} onAgree={handleAgree} onDecline={() => settle(false)} />
  );

  return { ensureConsent, consentModal };
}
