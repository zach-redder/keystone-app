import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';

const ActionLogResultModal = ({ visible, onClose, log }) => {
  if (!log) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.horizontalBarOuter}>
          <View style={styles.horizontalBar} />
        </View>
        <Text style={styles.title}>Action Log Result</Text>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={styles.sectionLabel}>Your Action</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{log.action_description || ''}</Text>
          </View>
          <Text style={styles.sectionLabel}>Related Keys</Text>
          <View style={styles.keyList}>
            {(() => {
              const keys = log.key_tags || [];
              const maxDisplay = 6;
              const displayKeys = keys.slice(0, maxDisplay);
              const extraCount = keys.length - maxDisplay;
              return (
                <>
                  {displayKeys.map((key, idx) => (
                    <View key={idx} style={styles.keyPill}>
                      <Text style={styles.keyPillText}>{key}</Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <View style={styles.keyPill}>
                      <Text style={styles.keyPillText}>+{extraCount} more</Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
          <Text style={styles.sectionLabel}>
            AI Response - {log.ai_persona ? `${log.ai_persona}` : ''}
          </Text>
          <View style={styles.resultBox}>
            {log.ai_response ? (
              <Markdown style={markdownStyles}>
                {log.ai_response.replace(/\\n/g, '\n')}
              </Markdown> 
            ) : (
              <Text style={styles.resultText}>No response.</Text>
            )}
          </View>
        </ScrollView>
        <View style={styles.buttonContainerFixed}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const markdownStyles = {
  body: { color: '#fff', fontSize: 16 },
  text: { color: '#fff' },
  strong: { color: '#D4DE95' },
  em: { color: '#B9C096' },
  code_inline: { backgroundColor: '#232323', color: '#D4DE95', borderRadius: 4, padding: 2 },
  code_block: { backgroundColor: '#232323', color: '#D4DE95', borderRadius: 6, padding: 8 },
  link: { color: '#B9C096', textDecorationLine: 'underline' },
  heading1: { color: '#D4DE95', fontSize: 22, fontWeight: 'bold' },
  heading2: { color: '#D4DE95', fontSize: 20, fontWeight: 'bold' },
  heading3: { color: '#D4DE95', fontSize: 18, fontWeight: 'bold' },
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
  content: {
    flex: 1,
    marginBottom: 80,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionLabel: {
    color: '#B9C096',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  resultBox: {
    backgroundColor: '#393939',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  keyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  keyPill: {
    backgroundColor: '#232323',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  keyPillText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonContainerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: '#B3B3B3',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: '#232323',
    fontSize: 18,
    fontWeight: '700',
  },
};

export default ActionLogResultModal; 