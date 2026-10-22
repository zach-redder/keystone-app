import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Markdown from '@ronradtke/react-native-markdown-display';
import { getPreferredAiPersona } from '../../services/user/userPreferences';
import {
  generateAIMessage, fetchAIChatMessages,
  insertAIChatMessagePair, clearAIChatConversation, fetchTodaysAIChatMessagePairCount,
} from '../../services/features/affirmationService';
import { checkUserProStatus } from '../../services/subscription/subscriptionService';
import { CHAT_MODES, DEFAULT_CHAT_MODE, isChatMode } from '../../constants/chatModes';
import { markdownStyles, chatStyles } from '../../components/chat/chatStyles';
import ProUpgradeModal from '../../components/modals/ProUpgradeModal';
import KeyChangeReviewModal from '../../components/modals/KeyChangeReviewModal';
import CrisisResourcesModal from '../../components/modals/CrisisResourcesModal';
import useKeyReview from '../../hooks/useKeyReview';
import useAiConsent from '../../hooks/useAiConsent';
import { detectCrisis } from '../../services/safety/crisisDetection';

const FREE_DAILY_PAIR_LIMIT = 10;

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mode = isChatMode(params.mode) ? params.mode : DEFAULT_CHAT_MODE;
  const config = CHAT_MODES[mode];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('AI');
  const [loadingAI, setLoadingAI] = useState(false);
  const [thinkingDots, setThinkingDots] = useState('');
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const scrollViewRef = useRef(null);
  // A message that already got the resources sheet isn't blocked a second time if the user sends it anyway
  const crisisShownForText = useRef(null);

  const review = useKeyReview(mode);
  const consent = useAiConsent();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      let cleanPersona = 'AI';
      try {
        const p = await getPreferredAiPersona();
        cleanPersona = p.replace(/:.*$/, '') || 'AI';
      } catch (e) {
        console.error('Error loading persona:', e);
      }
      if (isMounted) setPersona(cleanPersona);
      const chatMessages = await fetchAIChatMessages(mode);
      if (isMounted) setMessages(chatMessages);
    })();
    return () => { isMounted = false; };
  }, [mode]);

  useEffect(() => {
    let interval;
    if (loadingAI) {
      let count = 0;
      interval = setInterval(() => {
        count = (count + 1) % 4;
        setThinkingDots('.'.repeat(count));
      }, 400);
    } else {
      setThinkingDots('');
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loadingAI) return;

    if (!(await consent.ensureConsent())) return;

    // Resources come before the reply; the message stays in the box and the user decides whether to send it
    if (detectCrisis(text) && crisisShownForText.current !== text) {
      crisisShownForText.current = text;
      setShowCrisisResources(true);
      return;
    }

    await sendMessage(text);
  };

  const handleCrisisContinue = () => {
    setShowCrisisResources(false);
    const text = input.trim();
    if (text) sendMessage(text);
  };

  const sendMessage = async (text) => {
    const isPro = await checkUserProStatus();
    if (!isPro) {
      const todaysCount = await fetchTodaysAIChatMessagePairCount();
      if (todaysCount >= FREE_DAILY_PAIR_LIMIT) {
        setShowProUpgradeModal(true);
        return;
      }
    }

    setLoadingAI(true);
    const userMsg = { role: 'user', content: text };
    const history = messages;
    setMessages([...history, userMsg]);
    setInput('');
    try {
      const aiResponse = await generateAIMessage(mode, text, history);
      const aiMsg = { role: 'assistant', content: aiResponse };
      setMessages([...history, userMsg, aiMsg]);
      await insertAIChatMessagePair(mode, userMsg, aiMsg);
    } catch (err) {
      // A failed reply isn't saved: it would count against the daily limit and pollute the thread
      setMessages(history);
      setInput(text);
      Alert.alert('Something went wrong', 'There was a problem getting a response. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleResetChat = () => {
    Alert.alert(
      'Reset Chat',
      `Start a fresh ${config.title} conversation? This clears the thread from view. Your streaks and stats are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
            if (await clearAIChatConversation(mode)) {
              setMessages([]);
            } else {
              Alert.alert('Something went wrong', 'Could not reset the conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleVoice = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await checkUserProStatus()) {
      if (await consent.ensureConsent()) router.push(`/voice/${mode}`);
    } else {
      setShowProUpgradeModal(true);
    }
  };

  const handleReviewKeys = async () => {
    if (await consent.ensureConsent()) review.open();
  };

  const scrollToEnd = useCallback(() => scrollViewRef.current?.scrollToEnd({ animated: true }), []);
  const showWelcome = messages.length === 0;
  const canReview = messages.some(message => message.role === 'user');

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={[styles.headerSlot, { alignItems: 'flex-start' }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.tagline}>{config.tagline}</Text>
            </View>
            <View style={[styles.headerSlot, { alignItems: 'flex-end' }]}>
              <TouchableOpacity
                onPress={handleResetChat}
                style={styles.iconBtn}
                hitSlop={8}
                accessibilityLabel="Reset conversation"
              >
                <MaterialCommunityIcons name="restore" size={26} color="#B9C096" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.reviewBtn, !canReview && styles.reviewBtnDisabled]}
            onPress={handleReviewKeys}
            disabled={!canReview}
          >
            <Ionicons name="key-outline" size={16} color="#D4DE95" />
            <Text style={styles.reviewText}>Review keys</Text>
          </TouchableOpacity>

          <ScrollView
            style={{ flex: 1 }}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onContentSizeChange={scrollToEnd}
          >
            {showWelcome ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={[chatStyles.msgHeader, chatStyles.msgHeaderAI]}>{persona.toUpperCase()}</Text>
                <View style={chatStyles.aiMsg}>
                  <Markdown style={markdownStyles}>{config.welcome}</Markdown>
                </View>
              </View>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <View key={idx} style={{ marginBottom: 2 }}>
                    <Text
                      style={[
                        chatStyles.msgHeader,
                        msg.role === 'user' ? chatStyles.msgHeaderUser : chatStyles.msgHeaderAI,
                      ]}
                    >
                      {(msg.role === 'user' ? 'YOU' : persona).toUpperCase()}
                    </Text>
                    <View style={msg.role === 'user' ? chatStyles.userMsg : chatStyles.aiMsg}>
                      {msg.role === 'assistant' ? (
                        <Markdown style={markdownStyles}>{msg.content}</Markdown>
                      ) : (
                        <Text style={chatStyles.msgText}>{msg.content}</Text>
                      )}
                    </View>
                  </View>
                ))}
                {loadingAI && (
                  <View style={{ marginBottom: 2 }}>
                    <Text style={[chatStyles.msgHeader, chatStyles.msgHeaderAI]}>{persona.toUpperCase()}</Text>
                    <View style={chatStyles.aiMsg}>
                      <Text style={{ color: '#B3B3B3', fontSize: 15, fontStyle: 'italic' }}>
                        Thinking{thinkingDots}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={chatStyles.chatBoxRow}>
            <TextInput
              style={chatStyles.chatInput}
              placeholder={config.placeholder}
              placeholderTextColor="#A1A1AA"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="default"
              blurOnSubmit={false}
              multiline
            />
            {input.trim().length === 0 ? (
              <TouchableOpacity
                style={chatStyles.micBtn}
                onPress={handleVoice}
                accessibilityLabel="Switch to voice"
              >
                <Ionicons name="mic-outline" size={24} color="#D4DE95" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={chatStyles.sendBtn} onPress={handleSend} disabled={loadingAI}>
                <MaterialCommunityIcons name="send" size={26} style={{ left: 2 }} color="#232323" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ProUpgradeModal visible={showProUpgradeModal} onClose={() => setShowProUpgradeModal(false)} />
      {consent.consentModal}
      <CrisisResourcesModal
        visible={showCrisisResources}
        onContinue={handleCrisisContinue}
        onClose={() => setShowCrisisResources(false)}
      />
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

const styles = {
  page: { flex: 1, backgroundColor: '#2B2B2B' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBtn: { padding: 6 },
  headerSlot: { width: 44, justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  tagline: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#232323',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  reviewBtnDisabled: { opacity: 0.4 },
  reviewText: { color: '#D4DE95', fontWeight: '700', fontSize: 13, marginLeft: 6 },
};
