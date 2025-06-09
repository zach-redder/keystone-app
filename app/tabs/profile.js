import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOutUser } from '../../services/auth';

export default function ProfileScreen() {

  const router = useRouter();

  function handleSignOut() {
    signOutUser();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
        <Text>Profile</Text>
        <Button title="Sign Out" onPress={() => handleSignOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
