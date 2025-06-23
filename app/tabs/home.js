import { View, Text, SafeAreaView } from 'react-native';
import globalStyles from '../../styles/global';
import AlignButton from '../../components/AlignButton';

export default function HomeScreen() {
  return (
    <SafeAreaView style={globalStyles.pageBg}>
      <View style={globalStyles.pageBg}>
        <View style={globalStyles.headerRow}>
          <Text style={globalStyles.header}>Keystone</Text>
        </View>
        {/* Other home content here */}
        <AlignButton onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}