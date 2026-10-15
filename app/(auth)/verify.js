import { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { authLinkDestination, isOtpTypeAllowedForPath } from '../../services/auth/deepLinkOtp';
import { styles } from '../../styles/authentication';

// Reached when iOS/Android resolve https://thekeystoneapp.com/verify as a Universal/App
// Link and hand the URL straight to this app -- bypassing keystone-landingpage's `/verify`
// page (and its JS redirect into keystone://emailconfirmation etc.) entirely. This happens
// for taps inside Mail/Messages/etc. once the domain is actually associated (see
// keystone-landingpage's public/.well-known/apple-app-site-association, which registers
// this exact path); pasting the same link into a browser's address bar does NOT trigger
// Universal Links, so that route still goes through the website as before.
//
// Mirrors getDeepLinkPathForType() from keystone-landingpage's app/verify/page.tsx and the
// session-establishment logic from this app's own _layout.js (for the keystone:// scheme),
// since neither of those run for a Universal Link open.
const getAuthPathForType = (type, hasCode) => {
  switch (type) {
    case 'signup':
      return 'emailconfirmation';
    case 'email_change':
      return 'signin';
    case 'recovery':
      return 'resetpassword';
    default:
      return hasCode ? 'emailconfirmation' : null;
  }
};

export default function VerifyUniversalLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const run = async () => {
      const type = typeof params.type === 'string' ? params.type : null;
      const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : null;
      const code = typeof params.code === 'string' ? params.code : null;
      const path = getAuthPathForType(type, !!code);

      if (!path) {
        console.log('Universal link /verify had no recognizable auth payload, going home');
        router.replace('/');
        return;
      }

      let redirectType = null;
      try {
        if (tokenHash && type) {
          if (!isOtpTypeAllowedForPath(path, type)) {
            console.error('Universal link type is not valid for this path');
          } else {
            const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
            if (error) console.error('Failed to verify OTP from universal link:', error);
          }
        } else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error('Failed to exchange code from universal link:', error);
          redirectType = data?.redirectType ?? null;
        }
      } catch (error) {
        console.error('Error establishing session from universal link:', error);
      }

      router.replace(`/${authLinkDestination(path, redirectType)}`);
    };

    run();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
      <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
    </View>
  );
}
