import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgressBar() {
  const { step } = useLocalSearchParams();
  
  const steps = [
    'Welcome',
    'Explanation',
    'UserInteraction',
    'DefineIdentity',
    'ReceiveReminders',
    'LogActions',
    'AffirmVision'
  ];

  const currentStepIndex = steps.indexOf(step);
  const progress = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <View style={{
      position: 'absolute',
      top: 63,
      left: 50,
      right: 20,
      height: 3, // Thin line for sleek look
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 1.5, // Rounded ends
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1, // Minimal shadow
      shadowRadius: 1.5,
      elevation: 2,
    }}>
      <LinearGradient
        colors={['#D4DE95', '#D4DE95']} // Use button color for gradient
        start={[0, 0]}
        end={[1, 0]}
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 1.5,
        }}
      />
    </View>
  );
} 