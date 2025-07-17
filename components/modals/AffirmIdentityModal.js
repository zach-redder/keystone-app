import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPreferredAiPersona } from '../../services/userPreferences';

const AffirmIdentityModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    getPreferredAiPersona().then(p => {
      if (isMounted) {
        const cleanedPersona = p.replace(/:.*$/, '');
        setMessages([
          { from: 'ai', text: `Welcome! Chat with your AI assistant to affirm your identity and stay true to yourself.` }
        ]);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: input }]);
    setInput('');
    // Optionally, trigger AI response here
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'ai', text: 'This is a placeholder AI response.' }]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 600);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 36} // increased offset for higher chatbox
      >
        <View style={styles.modalContainer}>
          <View style={styles.horizontalBarOuter}>
            <View style={styles.horizontalBar} />
          </View>
          <Text style={styles.title}>Affirm Your Identity</Text>
          <ScrollView
            style={styles.content}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={msg.from === 'user' ? styles.userMsg : styles.aiMsg}
              >
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            ))}
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
    </Modal>
  );
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
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
  chatBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 32, // increased from 18 for more space from bottom
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
    marginLeft: 8,
    backgroundColor: '#B9C096',
    borderRadius: 35,
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
