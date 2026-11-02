import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/authentication';
import SignInForm from '../../components/forms/SignInForm';

export default function SignInScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // A session may already be established here by app/_layout.js's central deep-link
    // handler (e.g. an email_change confirmation lands on this route) -- trust it instead
    // of dropping the user on a blank login form.
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('Error checking session on sign-in screen:', error);
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [router]);

  if (checkingSession) {
    return (
      <View style={styles.container}>
        <Image source={require('../../assets/images/logos/keystone_transparent.png')} style={styles.logo} />
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return <SignInForm />;
}
