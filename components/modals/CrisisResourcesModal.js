import { View, Text, Modal, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  HELPLINE_URL,
  US_CRISIS_CALL_NUMBER,
  US_CRISIS_TEXT_NUMBER,
  US_CRISIS_TEXT_KEYWORD,
} from '../../services/safety/crisisDetection';

// Wording approved by the app owner; do not paraphrase.

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '88%',
    maxHeight: '88%',
    backgroundColor: '#2B2B2B',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  bodyText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#D4DE95',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '600',
  },
  outlineButton: {
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4DE95',
    alignItems: 'center',
    marginTop: 10,
  },
  outlineButtonText: {
    color: '#D4DE95',
    fontSize: 15,
    fontWeight: '500',
  },
  continueButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  continueButtonText: {
    color: '#DDDDDD',
    fontSize: 14,
    fontWeight: '500',
  },
};

// iOS and Android separate the message body from the number differently
const textMessageUrl = Platform.select({
  ios: `sms:${US_CRISIS_TEXT_NUMBER}&body=${US_CRISIS_TEXT_KEYWORD}`,
  default: `sms:${US_CRISIS_TEXT_NUMBER}?body=${US_CRISIS_TEXT_KEYWORD}`,
});

const open = async (url) => {
  try {
    await Linking.openURL(url);
  } catch (e) {
    Alert.alert('Could not open that', `Please try again, or visit ${HELPLINE_URL}.`);
  }
};

// onClose is the system back gesture, which only dismisses; onContinue is the explicit choice to go on
export default function CrisisResourcesModal({ visible, onContinue, onClose }) {
  const press = (url) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    open(url);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose ?? onContinue}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{"You're not alone"}</Text>
            <Text style={styles.bodyText}>
              {"What you wrote sounds really painful. Keystone can't give you the support you may need right now, but there are people who can, any time of day."}
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.strong}>{'In the US: '}</Text>
              {`call or text ${US_CRISIS_CALL_NUMBER} (Suicide & Crisis Lifeline), or text ${US_CRISIS_TEXT_KEYWORD} to ${US_CRISIS_TEXT_NUMBER} (Crisis Text Line).`}
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.strong}>{'Elsewhere: '}</Text>
              {'findahelpline.com lists services by country.'}
            </Text>
            <Text style={styles.bodyText}>
              {'If you might be in immediate danger, call your local emergency number.'}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => press(`tel:${US_CRISIS_CALL_NUMBER}`)}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>{`Call ${US_CRISIS_CALL_NUMBER}`}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => press(textMessageUrl)}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>{`Text ${US_CRISIS_TEXT_NUMBER}`}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.outlineButton} onPress={() => press(HELPLINE_URL)} accessibilityRole="link">
              <Text style={styles.outlineButtonText}>{'Find a helpline'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={onContinue} accessibilityRole="button">
              <Text style={styles.continueButtonText}>{'Continue to chat'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
