import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Button } from 'react-native';
import React from 'react';
import SignUpSignInForm from '../../components/SignUpSignInForm';
import { styles } from '../../styles/onboarding';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams();
  const router = useRouter();

  const nextStepMap = {
    PreferredAIPersona: 'NotificationOptIn',
    NotificationOptIn: 'PreferredReminderTime',
    PreferredReminderTime: 'SignUp',
    SignUp: 'tabs/home', // redirect to home after onboarding
  };

  const handleNext = () => {
    const nextStep = nextStepMap[step];
    if (nextStep) {
      router.replace(`/onboarding/${nextStep}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'PreferredAIPersona':
        return (
          <>
            <Text style={styles.title}>Select your preferred AI persona</Text>
            <Button title="Next" onPress={handleNext} />
          </>
        );
      case 'NotificationOptIn':
        return (
          <>
            <Text style={styles.title}>Would you like to receive notifications?</Text>
            <Button title="Next" onPress={handleNext} />
          </>
        );
      case 'PreferredReminderTime':
        return (
          <>
            <Text style={styles.title}>Choose your preferred reminder time</Text>
            <Button title="Next" onPress={handleNext} />
          </>
        );
      case 'SignUp':
        return <SignUpSignInForm />;
      default:
        return <Text style={styles.title}>Unknown step</Text>;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}
