import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function BackArrow() {
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <TouchableOpacity 
      onPress={handleBack}
      style={{
        position: 'absolute',
        top: 40,
        left: 0,
        zIndex: 10,
        padding: 8,
      }}
    >
      <Ionicons name="arrow-back" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
} 