import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPreferredAiPersona } from '../../services/userPreferences';
import { generateAIMessage, fetchAIChatMessages, insertAIChatMessagePair, fetchTodaysAIChatMessagePairCount, deleteAllAIChatMessages } from '../../services/affirmationService';
import { checkUserProStatus } from '../../services/auth';
import Markdown from 'react-native-markdown-display';

const AffirmIdentityModal = ({ visible, onClose, onRequestProUpgrade }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('AI');
  const [loadingAI, setLoadingAI] = useState(false);
  const scrollViewRef = useRef(null);
  const [thinkingDots, setThinkingDots] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      let cleanPersona = 'AI';
      try {
        const p = await getPreferredAiPersona();
        cleanPersona = p.replace(/:.*$/, '') || 'AI';
      } catch {}
      if (isMounted) setPersona(cleanPersona);
      const chatMessages = await fetchAIChatMessages();
      if (isMounted) {
        if (Array.isArray(chatMessages) && chatMessages.length > 0) {
          setMessages(chatMessages);
        } else {
          setMessages([]); // No messages, show welcome placeholder
        }
      }
    })();
    return () => { isMounted = false; };
  }, [visible]);

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
    if (!input.trim()) return;
    setLoadingAI(true);
    try {
      // Check pro status and today's AI chat count
      const isPro = await checkUserProStatus();
      if (!isPro) {
        const todayCount = await fetchTodaysAIChatMessagePairCount();
        if (todayCount >= 3) {
          setLoadingAI(false);
          if (onClose) onClose();
          if (onRequestProUpgrade) onRequestProUpgrade();
          return;
        }
      }
      const userMsg = { role: 'user', content: input };
      const prevMessages = [...messages, userMsg];
      setMessages(prevMessages);
      setInput('');
      const ai_response = await generateAIMessage(input, messages);
      const aiMsg = { role: 'assistant', content: ai_response };
      const updatedMessages = [...prevMessages, aiMsg];
      setMessages(updatedMessages);
      await insertAIChatMessagePair(userMsg, aiMsg);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      const userMsg = { role: 'user', content: input };
      const aiMsg = { role: 'assistant', content: 'Sorry, there was a problem getting a response.' };
      const prevMessages = [...messages, userMsg];
      const updatedMessages = [...prevMessages, aiMsg];
      setMessages(updatedMessages);
      await insertAIChatMessagePair(userMsg, aiMsg);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleResetChat = async () => {
    Alert.alert(
      'Reset Chat',
      'Are you sure you want to delete all your affirmation chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
            await deleteAllAIChatMessages();
            setMessages([]);
          }
        }
      ]
    );
  };

  const showWelcome = messages.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#2B2B2B' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 36}
        >
          <View style={styles.modalContainer}>
            <View style={styles.horizontalBarOuter}>
              <View style={styles.horizontalBar} />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Affirm Identity</Text>
              <TouchableOpacity onPress={handleResetChat} style={{ padding: 8 }}>
                <MaterialCommunityIcons name="restore" size={26} color="#B9C096" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.content}
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {showWelcome ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.msgHeader, styles.msgHeaderAI]}>{persona.toUpperCase()}</Text>
                  <View style={styles.aiMsg}>
                    <Markdown style={markdownStyles}>
                      {`**Welcome!**\n\nChat with your AI assistant to affirm your identity and stay authentic.`}
                    </Markdown>
                  </View>
                </View>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <View key={idx} style={{ marginBottom: 2 }}>
                      <Text
                        style={[
                          styles.msgHeader,
                          msg.role === 'user' ? styles.msgHeaderUser : styles.msgHeaderAI
                        ]}
                      >
                        {(msg.role === 'user' ? 'YOU' : persona).toUpperCase()}
                      </Text>
                      <View style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
                        {msg.role === 'assistant' ? (
                          <Markdown style={markdownStyles}>
                            {msg.content?.replace(/\n/g, '\n')}
                          </Markdown>
                        ) : (
                          <Text style={styles.msgText}>{msg.content}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                  {loadingAI && (
                    <View style={{ marginBottom: 2 }}>
                      <Text style={[styles.msgHeader, styles.msgHeaderAI]}>{persona.toUpperCase()}</Text>
                      <View style={styles.aiMsg}>
                        <Text style={{ color: '#B3B3B3', fontSize: 15, fontStyle: 'italic' }}>AI is thinking{thinkingDots}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            <View style={styles.chatBoxRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your message..."
                placeholderTextColor="#A1A1AA"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <MaterialCommunityIcons name="send" size={26} style={{ left: 2 }} color="#232323" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const markdownStyles = {
  body: { color: '#fff', fontSize: 15 },
  text: { color: '#fff' },
  strong: { color: '#D4DE95' },
  em: { color: '#B9C096' },
  code_inline: { backgroundColor: '#232323', color: '#D4DE95', borderRadius: 4, padding: 2 },
  code_block: { backgroundColor: '#232323', color: '#D4DE95', borderRadius: 6, padding: 8 },
  link: { color: '#B9C096', textDecorationLine: 'underline' },
  heading1: { color: '#D4DE95', fontSize: 18, fontWeight: 'bold' },
  heading2: { color: '#D4DE95', fontSize: 16, fontWeight: 'bold' },
  heading3: { color: '#D4DE95', fontSize: 15, fontWeight: 'bold' },
  hr: {
    borderBottomColor: '#555',
    borderBottomWidth: 1,
    marginVertical: 12,
  },
};

const styles = {
  modalContainer: {
    flex: 1,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  horizontalBarOuter: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  horizontalBar: {
    width: 48,
    height: 5,
    backgroundColor: '#555',
    borderRadius: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    marginVertical: 6,
    marginLeft: 40,
    marginRight: 0,
    maxWidth: '80%',
  },
  aiMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#3C3C3C',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginVertical: 6,
    marginRight: 40,
    marginLeft: 0,
    maxWidth: '80%',
  },
  msgText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  msgHeader: {
    fontSize: 11,
    color: '#B9C096',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  msgHeaderAI: {
    marginLeft: 6,
    textAlign: 'left',
  },
  msgHeaderUser: {
    marginRight: 6,
    textAlign: 'right',
  },
  chatBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 24 ,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 32,
    marginHorizontal: 0,
  },
  chatInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sendBtn: {
    marginLeft: 6,
    backgroundColor: '#D4DE95',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sendBtnText: {
    color: '#232323',
    fontWeight: '700',
    fontSize: 15,
  },
};

export default AffirmIdentityModal;
