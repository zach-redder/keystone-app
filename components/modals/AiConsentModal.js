import { View, Text, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../constants/legal';

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '88%',
    maxHeight: '85%',
    backgroundColor: '#2B2B2B',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  bodyText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#D4DE95',
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: '#DDDDDD',
    fontSize: 14,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  link: {
    color: '#AAAAAA',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    color: '#777777',
    fontSize: 12,
    marginHorizontal: 8,
  },
};

export default function AiConsentModal({ visible, onAgree, onDecline }) {
  const handleAgree = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAgree();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{'How your reflections are used'}</Text>
            <Text style={styles.bodyText}>
              {"Keystone's AI replies using what you write and the identity keys you save. To do that, we send your messages and keys to OpenAI, our AI provider, and in voice mode your voice as well, so it can generate a response."}
            </Text>
            <Text style={styles.bodyText}>
              {"We don't sell your data or use it for advertising, and our provider does not use it to train its models."}
            </Text>
            <Text style={styles.bodyText}>
              {'You can delete everything at any time from Profile > Delete account.'}
            </Text>
            <Text style={styles.bodyText}>
              {"Keystone is a self-reflection tool. It isn't therapy or medical advice."}
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAgree} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>{'Agree and continue'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onDecline} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>{'Not now'}</Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
                <Text style={styles.link}>{'Privacy Policy'}</Text>
              </TouchableOpacity>
              <Text style={styles.linkSeparator}>{'·'}</Text>
              <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)} accessibilityRole="link">
                <Text style={styles.link}>{'Terms'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
