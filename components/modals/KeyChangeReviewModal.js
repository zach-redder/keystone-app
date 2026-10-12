import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getCategoryLabel } from '../../constants/keyCategories';

const ACTION_STYLES = {
  add: { label: 'ADD', color: '#4CAF50' },
  update: { label: 'UPDATE', color: '#FFB74D' },
  delete: { label: 'REMOVE', color: '#FF4C4C' },
};

const changeId = (change, index) => `${index}-${change.action}-${change.keyId ?? change.newText}`;

const KeyChangeReviewModal = ({ visible, onClose, loading, error, changes, applying, onApply }) => {
  const [selected, setSelected] = useState({});

  // Nothing is pre-accepted: the user opts in to each change
  useEffect(() => {
    setSelected({});
  }, [changes, visible]);

  const toggle = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedChanges = changes.filter((change, index) => selected[changeId(change, index)]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handleOuter}>
          <View style={styles.handle} />
        </View>
        <Text style={styles.title}>Review your keys</Text>
        <Text style={styles.subtitle}>
          These come only from what you said. Nothing changes unless you accept it.
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#D4DE95" />
            <Text style={styles.muted}>Reading your conversation...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.muted}>{error}</Text>
          </View>
        ) : changes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No changes to suggest</Text>
            <Text style={styles.muted}>Your keys already match what you have shared so far.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {changes.map((change, index) => {
              const id = changeId(change, index);
              const isOn = !!selected[id];
              const action = ACTION_STYLES[change.action];
              return (
                <TouchableOpacity
                  key={id}
                  activeOpacity={0.85}
                  onPress={() => toggle(id)}
                  style={[styles.card, isOn && styles.cardOn]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.badge, { color: action.color, borderColor: action.color }]}>
                      {action.label}
                    </Text>
                    <Text style={styles.category}>{getCategoryLabel(change.category)}</Text>
                    <Ionicons
                      name={isOn ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isOn ? '#D4DE95' : '#777'}
                    />
                  </View>
                  {change.oldText ? (
                    <Text style={[styles.keyText, change.action === 'update' && styles.oldText]}>
                      {change.oldText}
                    </Text>
                  ) : null}
                  {change.newText ? <Text style={styles.keyText}>{change.newText}</Text> : null}
                  <Text style={styles.reason}>{change.reason}</Text>
                  <Text style={styles.quote}>You said: "{change.evidenceQuote}"</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={applying}>
            <Text style={styles.secondaryText}>{changes.length === 0 ? 'Close' : 'Dismiss all'}</Text>
          </TouchableOpacity>
          {changes.length > 0 && (
            <TouchableOpacity
              style={[styles.primaryBtn, (selectedChanges.length === 0 || applying) && styles.primaryBtnDisabled]}
              onPress={() => onApply(selectedChanges)}
              disabled={selectedChanges.length === 0 || applying}
            >
              {applying ? (
                <ActivityIndicator color="#232323" />
              ) : (
                <Text style={styles.primaryText}>Apply {selectedChanges.length || ''}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#2B2B2B', paddingHorizontal: 20, paddingTop: 10 },
  handleOuter: { alignItems: 'center', marginTop: 16, marginBottom: 20 },
  handle: { width: 48, height: 5, backgroundColor: '#555', borderRadius: 3 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, marginBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  muted: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: '#3C3C3C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardOn: { borderColor: '#D4DE95' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  category: { flex: 1, color: '#B9C096', fontSize: 13, fontWeight: '700' },
  keyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  oldText: { color: '#888', textDecorationLine: 'line-through', fontWeight: '400' },
  reason: { color: '#d4d4d8', fontSize: 14, marginTop: 4 },
  quote: { color: '#a1a1aa', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  footer: { flexDirection: 'row', paddingVertical: 16, paddingBottom: 32 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#232323',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  primaryBtn: { flex: 1, backgroundColor: '#D4DE95', borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryText: { color: '#232323', fontWeight: '700', fontSize: 15 },
};

export default KeyChangeReviewModal;
