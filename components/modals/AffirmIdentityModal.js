import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchIdentityKeys } from '../../services/userKeys';

const { height: screenHeight } = Dimensions.get('window');

const AffirmIdentityModal = ({ visible, onClose }) => {
  const [coreValues, setCoreValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showAiResponse, setShowAiResponse] = useState(false);

  // Affirmation questions based on core values
  const affirmationQuestions = [
    {
      id: 1,
      text: "How did you live out your core values today?",
      placeholder: "Share specific examples of how you embodied your values...",
    },
    {
      id: 2,
      text: "Which of your core values challenged you most today?",
      placeholder: "Describe the situation and how you responded...",
    },
    {
      id: 3,
      text: "What would your future self say about how you're living your values?",
      placeholder: "Reflect on your growth and alignment...",
    },
  ];

  // Load user's core values
  useEffect(() => {
    const loadCoreValues = async () => {
      if (!visible) return;
      
      console.log('AffirmIdentityModal: Loading core values...');
      
      try {
        setLoading(true);
        const keys = await fetchIdentityKeys();
        const values = keys.filter(key => key.category === 'Core Values');
        setCoreValues(values);
        console.log('AffirmIdentityModal: Core values loaded:', values.length);
      } catch (error) {
        console.error('Error loading core values:', error);
        Alert.alert('Error', 'Failed to load your core values');
      } finally {
        setLoading(false);
      }
    };

    loadCoreValues();
  }, [visible]);

  // Animation logic
  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setCurrentQuestion(0);
      setUserResponse('');
      setAiResponse('');
      setShowAiResponse(false);
    }
  }, [visible]);

  const closeModal = () => {
    console.log('AffirmIdentityModal: Closing modal');
    // Reset state
    setCurrentQuestion(0);
    setUserResponse('');
    setAiResponse('');
    setShowAiResponse(false);
    console.log('AffirmIdentityModal: Calling onClose');
    onClose();
  };

  const handleNextQuestion = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Save the current response if AI response was generated
    // TODO: Uncomment when affirmation_entries table is created
    // if (showAiResponse && userResponse.trim() && aiResponse.trim()) {
    //   try {
    //     await saveAffirmationEntry(
    //       affirmationQuestions[currentQuestion].text,
    //       userResponse,
    //       aiResponse
    //     );
    //   } catch (error) {
    //     console.error('Error saving affirmation entry:', error);
    //     // Don't block the flow, just log the error
    //   }
    // }
    
    if (currentQuestion < affirmationQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserResponse('');
      setAiResponse('');
      setShowAiResponse(false);
    } else {
      // All questions completed
      Alert.alert(
        'Affirmation Complete',
        'Great work reflecting on your identity and values! This practice helps strengthen your alignment.',
        [{ text: 'Finish', onPress: closeModal }]
      );
    }
  };

  const handlePreviousQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setUserResponse('');
      setAiResponse('');
      setShowAiResponse(false);
    }
  };

  if (loading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4DE95" />
          <Text style={styles.loadingText}>Loading your values...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.horizontalBar} />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Affirm Your Identity</Text>
          
          {/* Core Values Display */}
          {coreValues.length > 0 ? (
            <View style={styles.valuesContainer}>
              <Text style={styles.valuesTitle}>Your Core Values:</Text>
              <View style={styles.valuesList}>
                {coreValues.map((value, index) => (
                  <View key={index} style={styles.valueItem}>
                    <Ionicons name="diamond" size={14} color="#D4DE95" />
                    <Text style={styles.valueText}>{value.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noValuesContainer}>
              <Ionicons name="information-circle" size={20} color="#A1A1AA" />
              <Text style={styles.noValuesText}>
                You haven't defined your core values yet. This affirmation will help you reflect on your general identity and principles.
              </Text>
            </View>
          )}

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionCounter}>
              Question {currentQuestion + 1} of {affirmationQuestions.length}
            </Text>
            <Text style={styles.questionText}>
              {affirmationQuestions[currentQuestion].text}
            </Text>
          </View>

          {/* User Response Input */}
          <View style={styles.responseContainer}>
            <TextInput
              style={styles.responseInput}
              multiline
              numberOfLines={4}
              placeholder={affirmationQuestions[currentQuestion].placeholder}
              placeholderTextColor="#A1A1AA"
              value={userResponse}
              onChangeText={setUserResponse}
              textAlignVertical="top"
            />
          </View>

          {/* AI Response */}
          {showAiResponse && (
            <View style={styles.aiResponseContainer}>
              <View style={styles.aiResponseHeader}>
                <Ionicons name="sparkles" size={16} color="#D4DE95" />
                <Text style={styles.aiResponseTitle}>AI Reflection</Text>
              </View>
              <Text style={styles.aiResponseText}>{aiResponse}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!showAiResponse ? (
              <TouchableOpacity 
                style={[styles.actionButton, isGeneratingResponse && styles.disabledButton]} 
                onPress={[]}
                disabled={isGeneratingResponse}
              >
                {isGeneratingResponse ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Get AI Reflection</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handleNextQuestion}>
                <Text style={styles.actionButtonText}>
                  {currentQuestion < affirmationQuestions.length - 1 ? 'Next Question' : 'Complete'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.navigationButtons}>
              {currentQuestion > 0 && (
                <TouchableOpacity style={styles.navButton} onPress={handlePreviousQuestion}>
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  horizontalBar: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  valuesContainer: {
    marginBottom: 24,
    backgroundColor: '#3C3C3C',
    borderRadius: 16,
    padding: 16,
  },
  valuesTitle: {
    color: '#D4DE95',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  valuesList: {
    gap: 8,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  noValuesContainer: {
    marginBottom: 24,
    backgroundColor: '#3C3C3C',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noValuesText: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionCounter: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  responseContainer: {
    marginBottom: 24,
  },
  responseInput: {
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  aiResponseContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D4DE95',
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiResponseTitle: {
    color: '#D4DE95',
    fontSize: 16,
    fontWeight: '600',
  },
  aiResponseText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    backgroundColor: '#555',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#555',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
};

export default AffirmIdentityModal;
