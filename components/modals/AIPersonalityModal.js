import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { getPreferredAiPersona, setPreferredAiPersona } from '../../services/userPreferences';
import { checkUserProStatus } from '../../services/auth';
import keysStyles from '../../styles/keys';

const AIPersonalityModal = ({ visible, onClose, onUpgradePress }) => {
  const [selectedPersonality, setSelectedPersonality] = useState('Default');
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Original three free personalities from onboarding
  const freePersonalities = [
    {
      name: 'Gentle Guide',
      description: 'Kind and encouraging. Offers gentle support when you need it most.',
      icon: 'heart-outline',
    },
    {
      name: 'Supportive Friend',
      description: 'Direct but caring truth-telling with steady accountability. Your honest friend who keeps you focused.',
      icon: 'people-outline',
    },
    {
      name: 'Disciplined Mentor',
      description: 'No excuses. Sharp, intense, and built to push you beyond your limits.',
      icon: 'fitness-outline',
    },
  ];

  // Additional Pro personalities
  const proPersonalities = [
    {
      name: 'Life Coach',
      description: 'Professional and strategic. Structured approach to achieving your goals.',
      icon: 'trophy-outline',
    },
    {
      name: 'Mindful Monk',
      description: 'Calm and centered. Focuses on presence, balance, and inner peace.',
      icon: 'leaf-outline',
    },
    {
      name: 'David Goggins',
      description: 'Mental toughness and extreme discipline. "Stay hard" and push through any obstacle.',
      icon: 'barbell-outline',
    },
    {
      name: 'Andrew Tate',
      description: 'Unfiltered confidence and success mindset. Direct advice on winning and self-improvement.',
      icon: 'diamond-outline',
    },
    {
      name: 'Socrates',
      description: 'Questioning wisdom and self-discovery. "The only true wisdom is knowing you know nothing."',
      icon: 'help-circle-outline',
    },
    {
      name: 'Marcus Aurelius',
      description: 'Stoic emperor and philosopher. "You have power over your mind - not outside events. Realize this, and you will find strength."',
      icon: 'library-outline',
    },
    {
      name: 'Yoda',
      description: 'Wise, patient mentor. "Do or do not, there is no try." Ancient wisdom for modern challenges.',
      icon: 'flash-outline',
    },
    {
      name: 'Gandalf',
      description: 'Wise wizard with ancient knowledge. "All we have to decide is what to do with the time that is given us."',
      icon: 'sparkles-outline',
    },
    {
      name: 'Master Oogway',
      description: 'Ancient tortoise wisdom and inner peace. "Yesterday is history, tomorrow is a mystery, but today is a gift."',
      icon: 'flower-outline',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadCurrentPersonality();
      checkProStatus();
    }
  }, [visible]);

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

  const checkProStatus = async () => {
    try {
      const proStatus = await checkUserProStatus();
      setIsPro(proStatus);
    } catch (error) {
      console.error('Error checking pro status:', error);
    }
  };

  const handlePersonalitySelect = async (personalityName) => {
    const personalities = isPro ? proPersonalities : freePersonalities;

    const selected = personalities.find(p => p.name === personalityName);

    if (!selected) {
      console.warn("Selected personality not found.");
      return;
    }

    if (!isPro && !freePersonalities.find(p => p.name === personalityName)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUpgradePress();
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

  const handleClose = () => {
    onClose();
  };

  const renderPersonalityCard = (personality, isLocked = false) => (
    <TouchableOpacity
      key={personality.name}
      style={[
        styles.personalityCard,
        selectedPersonality === personality.name && styles.selectedCard,
        isLocked && styles.lockedCard,
      ]}
      onPress={() => {
        if (isLocked) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onUpgradePress && onUpgradePress();
        } else {
          handlePersonalitySelect(personality.name);
        }
      }}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.iconContainer,
          selectedPersonality === personality.name && styles.selectedIconContainer
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
            {isLocked && (
              <View style={styles.lockContainer}>
                <Ionicons name="lock-closed" size={16} color="#B9C096" />
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.personalityDescription,
            selectedPersonality === personality.name && styles.selectedDescription
          ]}>
            {personality.description}
          </Text>
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
            <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>Free Personalities</Text>
            {freePersonalities.map(personality => renderPersonalityCard(personality, false))}
            
            <Text style={styles.sectionTitle}>Pro Personalities</Text>
            {proPersonalities.map(personality => renderPersonalityCard(personality, !isPro))}
          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
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
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#2b2b2b',
    borderColor: '#B9C096',
  },
  lockedCard: {
    opacity: 0.6,
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
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proText: {
    fontSize: 12,
    color: '#B9C096',
    fontWeight: '600',
    marginLeft: 4,
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
};

export default AIPersonalityModal;
