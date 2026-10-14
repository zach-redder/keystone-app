import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { getPreferredAiPersona, setPreferredAiPersona } from '../../services/user/userPreferences';
import { fetchCustomPersonalities, createCustomPersonality, deleteCustomPersonality } from '../../services/features/customPersonalitiesService';
import { VOICES, DEFAULT_VOICE, DEFAULT_PERSONA_VOICES } from '../../services/voice/personaVoice';
import { playPreview, stopPreview, releasePreview, PREVIEW_LINE } from '../../services/voice/voicePreview';
import keysStyles from '../../styles/keys';

const voiceLabel = (voiceId) => VOICES.find(voice => voice.id === voiceId)?.label ?? null;

const AIPersonalityModal = ({ visible, onClose, onUpgradePress }) => {
  const [selectedPersonality, setSelectedPersonality] = useState('Default');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customVoice, setCustomVoice] = useState(DEFAULT_VOICE);
  const [previewingVoice, setPreviewingVoice] = useState(null);
  const [customPersonalities, setCustomPersonalities] = useState([]);

          // Basic personalities available to all users
  const basicPersonalities = [
    {
      name: 'Life Coach',
      description: 'Professional and strategic. Has a structured approach to achieving your goals.',
      icon: 'trophy-outline',
    },
    {
      name: 'Mindful Monk',
      description: 'Calm and centered. Focuses on presence, balance, and inner peace.',
      icon: 'leaf-outline',
    },
    {
      name: 'Gentle Guide',
      description: 'Kind and encouraging. Offers gentle support when you need it most.',
      icon: 'heart-outline',
    },
    {
      name: 'Supportive Friend',
      description: 'Direct but caring with steady accountability keeping you focused.',
      icon: 'people-outline',
    },
    {
      name: 'Disciplined Mentor',
      description: 'No excuses. Sharp, intense, and built to push you beyond your limits.',
      icon: 'fitness-outline',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadCurrentPersonality();
      loadCustomPersonalities();
    } else {
      stopPreview();
      setPreviewingVoice(null);
    }
  }, [visible]);

  // Leaving the screen must not leave a sample playing
  useEffect(() => releasePreview, []);

  const togglePreview = async (voiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (previewingVoice === voiceId) {
      stopPreview();
      return;
    }
    setPreviewingVoice(voiceId);
    try {
      await playPreview(voiceId, () => setPreviewingVoice(current => (current === voiceId ? null : current)));
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setPreviewingVoice(null);
    }
  };

  const loadCurrentPersonality = async () => {
    try {
      let personality = await getPreferredAiPersona();
      // If the stored value is 'Name: Description', extract just the name
      if (personality && personality.includes(':')) {
        personality = personality.split(':')[0].trim();
      }
      setSelectedPersonality(personality);
    } catch (error) {
      console.error('Error loading personality:', error);
    }
  };

  const loadCustomPersonalities = async () => {
    try {
      const customs = await fetchCustomPersonalities();
      setCustomPersonalities(customs);
    } catch (error) {
      console.error('Error loading custom personalities:', error);
      setCustomPersonalities([]);
    }
  };

  const handlePersonalitySelect = async (personalityName, isCustom = false) => {
    let selected;
    
    if (isCustom) {
      selected = customPersonalities.find(p => p.name === personalityName);
    } else {
      selected = basicPersonalities.find(p => p.name === personalityName);
    }

    if (!selected) {
      console.warn("Selected personality not found.");
      return;
    }

    const fullPersona = `${selected.name}: ${selected.description}`;

    setIsLoading(true);
    try {
      await setPreferredAiPersona(fullPersona);
      setSelectedPersonality(selected.name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error setting personality:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomPersonality = async () => {
    if (!customName.trim() || !customDescription.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    const newPersonality = {
      name: customName.trim(),
      description: customDescription.trim(),
      icon: 'create-outline', // Default icon for custom personalities
      isCustom: true,
    };

    setIsLoading(true);
    try {
      // Create in database
      const createdPersonality = await createCustomPersonality({
        name: newPersonality.name,
        description: newPersonality.description,
        icon: newPersonality.icon,
        voice: customVoice,
      });
      
      if (createdPersonality) {
        // Add to local state
        setCustomPersonalities(prev => [...prev, createdPersonality]);
        
        // Set as selected personality
        const fullPersona = `${createdPersonality.name}: ${createdPersonality.description}`;
        await setPreferredAiPersona(fullPersona);
        setSelectedPersonality(createdPersonality.name);
        
        // Reset form
        stopPreview();
        setCustomName('');
        setCustomDescription('');
        setCustomVoice(DEFAULT_VOICE);
        setShowCustomForm(false);
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        console.error('Failed to create custom personality');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error('Error creating custom personality:', error);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomPersonality = async (personalityName) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Find the personality to get its ID
      const personalityToDelete = customPersonalities.find(p => p.name === personalityName);
      if (!personalityToDelete || !personalityToDelete.id) {
        console.error('Cannot find personality to delete');
        return;
      }
      
      // Delete from database
      const success = await deleteCustomPersonality(personalityToDelete.id);
      
      if (success) {
        // Remove from local state
        setCustomPersonalities(prev => prev.filter(p => p.name !== personalityName));
        
        // If this was the selected personality, switch to default
        if (selectedPersonality === personalityName) {
          await setPreferredAiPersona('Life Coach: Professional and strategic. Structured approach to achieving your goals.');
          setSelectedPersonality('Life Coach');
        }
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        console.error('Failed to delete custom personality');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error('Error deleting custom personality:', error);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderPersonalityCard = (personality) => (
    <TouchableOpacity
      key={personality.name}
      style={[
        styles.personalityCard,
        selectedPersonality === personality.name && styles.selectedCard,
      ]}
      onPress={() => {
        handlePersonalitySelect(personality.name, personality.isCustom);
      }}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.iconContainer,
          selectedPersonality === personality.name && styles.selectedIconContainer,
        ]}>
          <Ionicons
            name={personality.icon}
            size={24}
            color="#B9C096"
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.personalityName,
              selectedPersonality === personality.name && styles.selectedName
            ]}>
              {personality.name}
            </Text>
          </View>
          <Text style={[
            styles.personalityDescription,
            selectedPersonality === personality.name && styles.selectedDescription
          ]}>
            {personality.description}
          </Text>
          {voiceLabel(personality.isCustom ? personality.voice : DEFAULT_PERSONA_VOICES[personality.name]) ? (
            <Text style={styles.voiceTag}>
              Voice: {voiceLabel(personality.isCustom ? personality.voice : DEFAULT_PERSONA_VOICES[personality.name])}
            </Text>
          ) : null}
        </View>
      </View>
      {selectedPersonality === personality.name && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#B9C096" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCustomPersonalityCard = (personality) => (
    <TouchableOpacity
      key={personality.name}
      style={[
        styles.customPersonalityCard,
        selectedPersonality === personality.name && styles.selectedCard,
      ]}
      onPress={() => {
        handlePersonalitySelect(personality.name, personality.isCustom);
      }}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.iconContainer,
          selectedPersonality === personality.name && styles.selectedIconContainer,
        ]}>
          <Ionicons
            name={personality.icon}
            size={24}
            color="#B9C096"
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.personalityName,
              selectedPersonality === personality.name && styles.selectedName
            ]}>
              {personality.name}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteCustomPersonality(personality.name)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <Text style={[
            styles.personalityDescription,
            selectedPersonality === personality.name && styles.selectedDescription
          ]}>
            {personality.description}
          </Text>
          {voiceLabel(personality.isCustom ? personality.voice : DEFAULT_PERSONA_VOICES[personality.name]) ? (
            <Text style={styles.voiceTag}>
              Voice: {voiceLabel(personality.isCustom ? personality.voice : DEFAULT_PERSONA_VOICES[personality.name])}
            </Text>
          ) : null}
        </View>
      </View>
      {selectedPersonality === personality.name && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#B9C096" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={keysStyles.infoModalContainer}>
        <View style={keysStyles.horizontalBar} />
        
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={keysStyles.infoSectionTitle}>AI Personality</Text>
            <Text style={styles.subtitle}>Choose how your AI companion communicates with you</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <ScrollView style={keysStyles.infoContent} showsVerticalScrollIndicator={false}>
          <View style={styles.personalitiesContainer}> 
            {/* Show existing custom personalities */}
            {customPersonalities.length > 0 && (
              <View style={styles.customPersonalitiesSection}>
                {customPersonalities.map(personality => renderCustomPersonalityCard(personality))}
              </View>
            )}
            
            {/* Create new custom personality */}
            {!showCustomForm ? (
              <TouchableOpacity
                style={styles.createCustomButton}
                onPress={() => {
                  setShowCustomForm(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.createCustomContent}>
                  <View style={styles.createIconContainer}>
                    <Ionicons name="add-circle-outline" size={32} color="#B9C096" />
                  </View>
                  <View style={styles.createTextContainer}>
                    <Text style={styles.createCustomTitle}>
                      {customPersonalities.length > 0 ? 'Create Another Custom Personality' : 'Create Custom Personality'}
                    </Text>
                    <Text style={styles.createCustomSubtitle}>Design your own AI companion with a unique name and description</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.customForm}>
                <Text style={styles.formTitle}>Create Your AI Personality</Text>
                
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g., Personal Trainer, Wise Sage, Motivational Speaker"
                  placeholderTextColor="#888"
                  maxLength={50}
                />
                
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={customDescription}
                  onChangeText={setCustomDescription}
                  placeholder="Describe how this personality should communicate with you..."
                  placeholderTextColor="#888"
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />

                <Text style={styles.inputLabel}>Voice</Text>
                <View style={styles.voiceChips}>
                  {VOICES.map(voice => {
                    const selected = customVoice === voice.id;
                    const playing = previewingVoice === voice.id;
                    return (
                      <View key={voice.id} style={[styles.voiceChip, selected && styles.voiceChipSelected]}>
                        <TouchableOpacity
                          style={styles.voiceChipLabel}
                          onPress={() => {
                            setCustomVoice(voice.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          activeOpacity={0.7}
                          accessibilityLabel={`${voice.label} voice, ${voice.blurb}`}
                        >
                          <Text style={[styles.voiceChipText, selected && styles.voiceChipTextSelected]}>
                            {voice.label}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.voicePlayButton}
                          onPress={() => togglePreview(voice.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                          accessibilityLabel={playing ? `Stop ${voice.label} sample` : `Play ${voice.label} sample`}
                        >
                          <Ionicons
                            name={playing ? 'stop-circle' : 'play-circle'}
                            size={22}
                            color={selected ? '#2B2B2B' : '#B9C096'}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.voiceHint}>
                  {VOICES.find(voice => voice.id === customVoice)?.blurb}. Used in voice chat.
                </Text>
                <Text style={styles.voiceHint}>Tap play to hear a sample: "{PREVIEW_LINE}"</Text>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      stopPreview();
                      setShowCustomForm(false);
                      setCustomName('');
                      setCustomDescription('');
                      setCustomVoice(DEFAULT_VOICE);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      (!customName.trim() || !customDescription.trim()) && styles.disabledButton
                    ]}
                    onPress={handleCreateCustomPersonality}
                    disabled={!customName.trim() || !customDescription.trim() || isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createButtonText}>
                      {isLoading ? 'Creating...' : 'Create & Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <Text style={[styles.sectionTitle]}>Personalities</Text>
            {basicPersonalities.map(personality => renderPersonalityCard(personality, false))}

          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
      </Modal>
    </>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 15,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 15,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  personalitiesContainer: {
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 20,
  },
  firstSectionTitle: {
    marginTop: 0,
  },
  personalityCard: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  selectedCard: {
    backgroundColor: 'rgba(80, 80, 80, 0.65)',
    borderColor: '#B9C096',
    borderTopColor: '#B9C096',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#3a3a3a',
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personalityName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  selectedName: {
    color: '#B9C096',
  },
  customPersonalitiesSection: {
    marginBottom: 16,
  },
  customPersonalityCard: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    marginLeft: 12,
  },
  personalityDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  selectedDescription: {
    color: '#ddd',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomSpacing: {
    height: 40,
  },
  // Custom personality creation styles
  createCustomButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  createCustomContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createIconContainer: {
    marginRight: 16,
  },
  createTextContainer: {
    flex: 1,
  },
  createCustomTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  createCustomSubtitle: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  customForm: {
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#B9C096',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#555',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#B9C096',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#2B2B2B',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  voiceChipLabel: {
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 6,
  },
  voicePlayButton: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  voiceChipSelected: {
    backgroundColor: '#B9C096',
    borderColor: '#B9C096',
  },
  voiceChipText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceChipTextSelected: {
    color: '#2B2B2B',
  },
  voiceHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  voiceTag: {
    color: '#B9C096',
    fontSize: 12,
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
};

export default AIPersonalityModal;
