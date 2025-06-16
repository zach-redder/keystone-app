import { View, Text } from 'react-native';
import { styles } from '../../styles/onboarding';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Animation() {
    const router = useRouter();

    const handleNext = () => {
        router.push('/onboarding/FutureSelfVision');
    };

  return (
    <View style={styles.container}>
        <Text style={styles.subtitle}>
        animation.
        </Text>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
    </View>
    );
}
