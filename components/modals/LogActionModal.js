import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchIdentityKeys } from '../../services/user/userKeys';
import { submitActionLogWithAI } from '../../services/features/actionLogs';
import { checkUserProStatus } from '../../services/subscription/subscriptionService';

const LogActionModal = ({ visible, onClose, onSubmit }) => {
  const [action, setAction] = useState('');
  const [keys, setKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [keyTypes, setKeyTypes] = useState([]);
  const [selectedKeyType, setSelectedKeyType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchIdentityKeys()
        .then(fetchedKeys => {
          setKeys(fetchedKeys);
          // Extract unique key types from fetched keys
          const types = Array.from(new Set(fetchedKeys.map(k => k.category)));
          setKeyTypes(types);
          setSelectedKeyType(types[0] || '');
        })
        .catch(() => {
          setKeys([]);
          setKeyTypes([]);
          setSelectedKeyType('');
        });
      setSelectedKeys([]);
    }
  }, [visible]);

  const handleKeyToggle = (key) => {
    setSelectedKeys(prev => {
      if (prev.some(k => k.id === key.id)) {
        return prev.filter(k => k.id !== key.id);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSubmit = async () => {
    if (action.trim() && selectedKeys.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);
      try {
        // Check user pro status
        const isPro = await checkUserProStatus();
        const savedLog = await submitActionLogWithAI(action, selectedKeys, isPro);
        setAction('');
        setSelectedKeys([]);
        setLoading(false);
        onClose(); // Close the LogActionModal first
        if (typeof onSubmit === 'function') {
          setTimeout(() => {
            onSubmit(savedLog);
          }, 350); // Wait for modal close animation
        }
      } catch (err) {
        setLoading(false);
        // Optionally show error
      }
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAction('');
    setSelectedKeys([]);
    onClose();
  };

  // Remove keyTypeSelectorBar and add carousel logic
  const handleKeyTypeLeft = () => {
    if (!keyTypes.length) return;
    setSelectedKeyType(prev => {
      const idx = keyTypes.indexOf(prev);
      return keyTypes[(idx - 1 + keyTypes.length) % keyTypes.length];
    });
  };
  const handleKeyTypeRight = () => {
    if (!keyTypes.length) return;
    setSelectedKeyType(prev => {
      const idx = keyTypes.indexOf(prev);
      return keyTypes[(idx + 1) % keyTypes.length];
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <View style={styles.horizontalBarOuter}>
          <View style={styles.horizontalBar} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={styles.title}>Log Action</Text>
          <Text style={styles.description}>
            Log an action or decision you made to determine if it aligns with your character.
          </Text>
          {/* Action Input */}
          <View style={styles.responseContainer}>
            <TextInput
              style={styles.responseInput}
              placeholder="Describe your action..."
              placeholderTextColor="#A1A1AA"
              value={action}
              onChangeText={setAction}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          {/* Key Selection Section */}
          <View style={styles.keySection}>
            <View style={styles.keySectionHeaderRow}>
              <Text style={styles.keySectionTitle}>Related Keys</Text>
              <View style={styles.selectAllRow}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => setSelectedKeys([...keys])}
                >
                  <Text style={styles.selectAllButtonText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => setSelectedKeys([])}
                >
                  <Text style={styles.selectAllButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Key Type Selector Bar */}
            {keyTypes.length > 0 && (
              <View style={styles.keyTypeBarOuter}>
                <View style={styles.keyTypeBar}>
                  <TouchableOpacity onPress={handleKeyTypeLeft} style={styles.arrowButtonBar}>
                    <Text style={styles.arrowTextBar}>{'‹'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.keyTypeBarText} numberOfLines={1} ellipsizeMode="tail">
                    {selectedKeyType === 'future_self_vision'
                      ? 'Future Identity'
                      : selectedKeyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <TouchableOpacity onPress={handleKeyTypeRight} style={styles.arrowButtonBar}>
                    <Text style={styles.arrowTextBar}>{'›'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.keyList}>
              {keys.filter(k => k.category === selectedKeyType).length === 0 ? (
                <Text style={styles.keyEmptyText}>No keys found for this type.</Text>
              ) : (
                keys.filter(k => k.category === selectedKeyType).map((key, idx) => (
                  <TouchableOpacity
                    key={key.id || idx}
                    style={[
                      styles.keyPill,
                      selectedKeys.some(k => k.id === key.id) && styles.keyPillSelected,
                    ]}
                    onPress={() => handleKeyToggle(key)}
                  >
                    <Text style={[
                      styles.keyPillText,
                      selectedKeys.some(k => k.id === key.id) && styles.keyPillTextSelected,
                    ]}>{key.description}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
        {/* Action Buttons Fixed at Bottom */}
        <View style={styles.buttonContainerFixed}>
          <TouchableOpacity 
            style={[styles.actionButton, (!action.trim() || selectedKeys.length === 0 || loading) && { opacity: 0.5 }]} 
            onPress={handleSubmit}
            disabled={!action.trim() || selectedKeys.length === 0 || loading}
          >
            <Text style={styles.actionButtonText}>Submit Action</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    color: '#A1A1AA',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  responseContainer: {
    marginBottom: 24,
  },
  responseInput: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#232323',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  keySection: {
    marginBottom: 28,
  },
  keySectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  keyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  keyPill: {
    backgroundColor: '#232323',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#444',
  },
  keyPillSelected: {
    shadowColor: '#B9C096',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
    borderColor: '#B9C096',
  },
  keyPillText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  keyEmptyText: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
  },
  keyTypeCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 0,
  },
  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  arrowText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    opacity: 0.7,
  },
  keyTypePillCarousel: {
    backgroundColor: '#232323',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyTypePillTextCarousel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  keyTypeBarOuter: {
    alignItems: 'stretch',
    marginBottom: 16,
    width: '100%',
  },
  keyTypeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 20,
    alignSelf: 'stretch',
    width: '100%',
    height: 58,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    flex: 1,
  },
  arrowButtonBar: {
    paddingHorizontal: 18,
    paddingVertical: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    flexDirection: 'row',
  },
  arrowTextBar: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '300',
    opacity: 1,
    marginHorizontal: 2,
    lineHeight: 58,
  },
  keyTypeBarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
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
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  selectAllButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  selectAllButtonText: {
    color: '#B9C096',
    fontSize: 14,
    fontWeight: '600',
  },
  keySectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,43,43,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
};

export default LogActionModal;
