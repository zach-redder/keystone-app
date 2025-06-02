import React from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const handleSignUp = async () => {
    // Implement your sign-up logic with Supabase here
    const { user, error } = await supabase.auth.signUp({
      email: 'user@example.com',
      password: 'password',
    });

    if (error) {
      console.error(error);
    } else {
      console.log('User signed up:', user);
      // Update onboarding_complete in the database
      const { data, updateError } = await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating onboarding status:', updateError);
      } else {
        console.log('Onboarding complete updated:', data);
        // Navigate to the main app
        navigation.replace('MainAppNavigator');
      }
    }
  };

  return (
    <View>
      <Text>Sign Up</Text>
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}