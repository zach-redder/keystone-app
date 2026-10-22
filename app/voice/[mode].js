import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Linking, Alert, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AIOrb from '../../components/voice/AIOrb';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import KeyChangeReviewModal from '../../components/modals/KeyChangeReviewModal';
import CrisisResourcesModal from '../../components/modals/CrisisResourcesModal';
import useVoiceSession from '../../hooks/useVoiceSession';
import useKeyReview from '../../hooks/useKeyReview';
import { CHAT_MODES, DEFAULT_CHAT_MODE, isChatMode } from '../../constants/chatModes';
import { clearAIChatConversation } from '../../services/features/affirmationService';

const MAX_ORB_SIZE = 350;
const ORB_WIDTH_RATIO = 0.92;
const WARNING_MESSAGES = 5;

const STATE_LABELS = {
  connecting: 'Connecting...',
  listening: 'Listening',
  userSpeaking: 'Listening',
  thinking: 'Thinking...',
  speaking: 'Speaking',
};

const formatMessagesLeft = (count) => `${count} voice message${count === 1 ? '' : 's'} left today`;

// What to tell the user, and what they can do next, when a session isn't running
const describeStop = (error, endReason) => {
  if (error?.code === 'mic_denied') {
    return { title: 'Microphone is off', body: 'Allow microphone access in Settings to talk with your AI.', primary: 'settings' };
  }
  if (error?.code === 'voice_limit_reached') {
    return { title: 'That is all your voice messages for today', body: 'Chat is still open, and voice resets tomorrow.', primary: null };
  }
  if (error?.code === 'pro_required') {
    return { title: 'Voice is a Pro feature', body: 'Upgrade to talk with your AI out loud.', primary: null };
  }
  if (error) {
    return { title: 'Voice stopped', body: error.message, primary: 'retry' };
  }
  if (endReason === 'limit') {
    return { title: 'That is all your voice messages for today', body: 'Chat is still open, and voice resets tomorrow.', primary: null };
  }
  if (endReason === 'max_duration') {
    return { title: 'Conversation paused', body: 'Long conversations pause after a while. Start another any time.', primary: 'retry' };
  }
  if (endReason === 'background') {
    return { title: 'Paused', body: 'Voice stops when the app leaves the screen.', primary: 'retry' };
  }
  return { title: 'Conversation ended', body: null, primary: 'retry' };
};

export default function VoiceScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mode = isChatMode(params.mode) ? params.mode : DEFAULT_CHAT_MODE;
  const config = CHAT_MODES[mode];
  const { width } = useWindowDimensions();
  const orbSize = Math.min(MAX_ORB_SIZE, width * ORB_WIDTH_RATIO);

  const voice = useVoiceSession(mode);
  const review = useKeyReview(mode);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (voice.error?.code === 'pro_required') setShowUpgrade(true);
  }, [voice.error]);

  const goBack = () => {
    voice.end();
    router.back();
  };

  const goToChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voice.end();
    router.replace(`/chat/${mode}`);
  };

  // Same reset as the chat screen: hides the thread (stats and streaks stay) and reconnects with a clean history
  const handleReset = () => {
    Alert.alert(
      'Reset Conversation',
      `Start a fresh ${config.title} conversation? This clears the thread from view. Your streaks and stats are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
            if (await clearAIChatConversation(mode)) {
              voice.restart();
            } else {
              Alert.alert('Something went wrong', 'Could not reset the conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const reviewKeys = async () => {
    await voice.end();
    review.open();
  };

  const stopped = voice.ended;
  const stopInfo = stopped ? describeStop(voice.error, voice.endReason) : null;
  const showMessagesLeft = !stopped && voice.remainingMessages !== null && voice.remainingMessages <= WARNING_MESSAGES;

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.headerBtn} hitSlop={8} accessibilityLabel="Close voice">
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.tagline}>{config.tagline}</Text>
        </View>
        <TouchableOpacity
          onPress={handleReset}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityLabel="Reset conversation"
        >
          <MaterialCommunityIcons name="restore" size={26} color="#B9C096" />
        </TouchableOpacity>
      </View>

      <View style={styles.stage}>
        <AIOrb
          mode={mode}
          state={stopped ? 'idle' : voice.state}
          micLevel={voice.micLevel}
          aiLevel={voice.aiLevel}
          size={orbSize}
        />

        {stopped ? (
          <View style={styles.messageWrap}>
            <Text style={styles.stateLabel}>{stopInfo.title}</Text>
            {stopInfo.body ? <Text style={styles.caption}>{stopInfo.body}</Text> : null}
            <View style={styles.actions}>
              {stopInfo.primary === 'settings' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openSettings()}>
                  <Text style={styles.primaryText}>Open Settings</Text>
                </TouchableOpacity>
              )}
              {stopInfo.primary === 'retry' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={voice.restart}>
                  <Text style={styles.primaryText}>Talk again</Text>
                </TouchableOpacity>
              )}
              {voice.error?.code === 'pro_required' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowUpgrade(true)}>
                  <Text style={styles.primaryText}>See Pro</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryBtn} onPress={goToChat}>
                <Text style={styles.secondaryText}>Chat instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.messageWrap}>
            <Text style={styles.stateLabel}>{STATE_LABELS[voice.state] ?? ''}</Text>
            <Text style={styles.caption} numberOfLines={5}>{voice.caption ?? ''}</Text>
            {showMessagesLeft ? <Text style={styles.timer}>{formatMessagesLeft(voice.remainingMessages)}</Text> : null}
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <ControlButton
          icon={voice.muted ? 'mic-off' : 'mic'}
          label={voice.muted ? 'Unmute' : 'Mute'}
          active={voice.muted}
          disabled={stopped}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            voice.toggleMute();
          }}
        />
        <ControlButton icon="chatbubble-ellipses-outline" label="Chat" onPress={goToChat} />
        <ControlButton icon="key-outline" label="Review keys" onPress={reviewKeys} />
        <ControlButton icon="close" label="End" danger onPress={goBack} />
      </View>

      <ProUpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <CrisisResourcesModal visible={voice.crisisDetected} onContinue={voice.dismissCrisis} />
      <KeyChangeReviewModal
        visible={review.visible}
        onClose={review.close}
        loading={review.loading}
        error={review.error}
        changes={review.changes}
        applying={review.applying}
        onApply={review.apply}
      />
    </SafeAreaView>
  );
}

function ControlButton({ icon, label, onPress, active, danger, disabled }) {
  return (
    <TouchableOpacity
      style={styles.controlWrap}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      activeOpacity={0.8}
    >
      <View style={[styles.controlCircle, active && styles.controlActive, danger && styles.controlDanger, disabled && { opacity: 0.4 }]}>
        <Ionicons name={icon} size={26} color={danger ? '#fff' : active ? '#232323' : '#D4DE95'} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = {
  page: { flex: 1, backgroundColor: '#2B2B2B' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  headerBtn: { width: 44, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  tagline: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  messageWrap: { alignItems: 'center', minHeight: 150, marginTop: 8 },
  stateLabel: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  caption: { color: '#d4d4d8', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  timer: { color: '#FFB74D', fontSize: 13, fontWeight: '600', marginTop: 10 },
  actions: { alignItems: 'center', marginTop: 18 },
  primaryBtn: { backgroundColor: '#D4DE95', borderRadius: 24, paddingVertical: 13, paddingHorizontal: 28, marginBottom: 10 },
  primaryText: { color: '#232323', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  secondaryText: { color: '#D4DE95', fontWeight: '600', fontSize: 15 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8 },
  controlWrap: { alignItems: 'center', width: 76 },
  controlCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#232323', alignItems: 'center', justifyContent: 'center' },
  controlActive: { backgroundColor: '#D4DE95' },
  controlDanger: { backgroundColor: '#FF4C4C' },
  controlLabel: { color: '#a1a1aa', fontSize: 12, marginTop: 6 },
};
