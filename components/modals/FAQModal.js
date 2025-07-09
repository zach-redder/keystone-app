import { View, Text, Modal, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import keysStyles from '../../styles/keys';

const FAQModal = ({ visible, onClose }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const animationRefs = useRef({});

  const toggleItem = (index) => {
    // Initialize animation if it doesn't exist
    if (!animationRefs.current[index]) {
      animationRefs.current[index] = new Animated.Value(0);
    }

    const isExpanding = !expandedItems[index];
    
    setExpandedItems(prev => ({
      ...prev,
      [index]: isExpanding
    }));

    // Animate the chevron rotation
    Animated.timing(animationRefs.current[index], {
      toValue: isExpanding ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    setExpandedItems({});
    onClose();
  };

  const faqData = [
    {
      question: "What are Keys?",
      answer: "Keys are the core building blocks of who you are and who you want to become. They include your Core Values, Life Goals, Future Identity, Identity Traits, Motivations, and Avoidances."
    },
    {
      question: "How do I create effective Keys?",
      answer: "Be specific and personal. Instead of generic values like 'be good,' write something meaningful like 'treat others with genuine compassion.' Quality over quantity is key."
    },
    {
      question: "How often should I review my Keys?",
      answer: "We recommend daily review through the app's affirmation feature. You can update your keys anytime as you grow and evolve."
    },
    {
      question: "What's the difference between Pro and Free?",
      answer: "Free gives you all core features. Pro unlocks advanced AI personalities, unlimited keys, detailed analytics, and priority support."
    },
    {
      question: "How does the AI personality work?",
      answer: "AI personalities adapt affirmations to match your preferences - whether you prefer a motivational coach, wise mentor, or supportive friend."
    },
    {
      question: "Is my data private and secure?",
      answer: "Absolutely. Your data is encrypted and stored securely. We never share your information with third parties. You own your data completely."
    }
  ];

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
            <Text style={keysStyles.infoSectionTitle}>Frequently Asked Questions</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <ScrollView style={keysStyles.infoContent} showsVerticalScrollIndicator={false}>
          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.questionContainer}
                  onPress={() => toggleItem(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Animated.View
                    style={[
                      styles.chevronContainer,
                      {
                        transform: [
                          {
                            rotate: animationRefs.current[index]
                              ? animationRefs.current[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg'],
                                })
                              : '0deg',
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#B9C096"
                    />
                  </Animated.View>
                </TouchableOpacity>
                
                {expandedItems[index] && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  faqContainer: {
    paddingTop: 0,
  },
  faqItem: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  questionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  answerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  answerText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 40,
  },
};

export default FAQModal;
