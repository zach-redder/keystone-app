import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Image,
  Share,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import { shareApp } from '../../services/features/shareService';
import { fetchAlignmentValue } from '../../services/features/alignmentService';
import { fetchRecentActionLog } from '../../services/features/actionLogs';
import { fetchTodayReminder } from '../../services/features/reminderService';
import { fetchIdentityKeys } from '../../services/user/userKeys';
import { getAppStoreLink } from '../../constants/appStore';
import { getUserReferralInfo } from '../../services/user/referralService';
import ReferralModal from './ReferralModal';
import ShareProgressCardEnhanced from '../cards/ShareProgressCardEnhanced';

const ShareProgressModal = ({ visible, onClose }) => {
  const shareCardRef = useRef(null);
  
  const [alignmentValue, setAlignmentValue] = useState(null);
  const [recentActionLog, setRecentActionLog] = useState(null);
  const [dailyReminder, setDailyReminder] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('alignment');
  const [selectedAlignmentCategory, setSelectedAlignmentCategory] = useState('core_values');
  const [bestAlignmentData, setBestAlignmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableAlignmentCategories, setAvailableAlignmentCategories] = useState([]);
  const [referralInfo, setReferralInfo] = useState(null);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Available alignment categories
  const alignmentCategories = [
    { id: 'core_values', title: 'Core Values', icon: 'heart' },
    { id: 'future_self_vision', title: 'Future Identity', icon: 'eye' },
    { id: 'life_goals', title: 'Life Goals', icon: 'flag' },
    { id: 'identity_traits', title: 'Identity Traits', icon: 'person' },
    { id: 'motivations', title: 'Motivations', icon: 'flash' },
    { id: 'avoidances', title: 'Avoidances', icon: 'close-circle' },
  ];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  // Set all alignment categories as available - let users choose any category
  const filterAlignmentCategories = async () => {
    try {
      console.log('ShareProgressModal - Setting all categories as available');
      setAvailableAlignmentCategories(alignmentCategories);
    } catch (error) {
      console.error('Error setting alignment categories:', error);
      setAvailableAlignmentCategories(alignmentCategories);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Filter alignment categories first
      await filterAlignmentCategories();
      
      // Load all alignment data to find the best score
      const alignmentPromises = alignmentCategories.map(async (category) => {
        const value = await fetchAlignmentValue(category.id);
        return { category, value };
      });
      
      const alignmentResults = await Promise.all(alignmentPromises);
      const validAlignments = alignmentResults.filter(result => result.value !== null);
      
      // Find the best alignment score
      let bestAlignment = null;
      if (validAlignments.length > 0) {
        bestAlignment = validAlignments.reduce((best, current) => {
          // Prefer scores closer to 0.5 (perfect alignment)
          const bestDistance = Math.abs(best.value - 0.5);
          const currentDistance = Math.abs(current.value - 0.5);
          return currentDistance < bestDistance ? current : best;
        });
      }
      
      console.log('ShareProgressModal - Best alignment:', bestAlignment);
      
      // Load action log data
      const actionLog = await fetchRecentActionLog();
      console.log('ShareProgressModal - Action log:', actionLog);
      
      // Load reminder data
      const reminder = await fetchTodayReminder();
      console.log('ShareProgressModal - Reminder:', reminder);
      
      // Load referral data
      const referralInfo = await getUserReferralInfo();
      
      console.log('ShareProgressModal - Final data:', {
        bestAlignment: bestAlignment ? `${bestAlignment.category.title}: ${bestAlignment.value}` : 'NULL',
        actionLog: actionLog ? 'EXISTS' : 'NULL',
        reminder: reminder || 'EMPTY',
        referralInfo: referralInfo ? 'EXISTS' : 'NULL'
      });
      
      setBestAlignmentData(bestAlignment);
      setRecentActionLog(actionLog);
      setDailyReminder(reminder);
      setReferralInfo(referralInfo);
    } catch (error) {
      console.error('Error loading share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getShareMessage = () => {
    const appLink = getAppStoreLink();
    switch (selectedTemplate) {
      case 'alignment':
        const categoryTitle = bestAlignmentData ? bestAlignmentData.category.title : 'Alignment';
        return `🔥 Just crushed my ${categoryTitle} goals! Building elite discipline with Keystone.\n\nJoin me: ${appLink}`;
      case 'action':
        return `💪 Another win in the books! Taking action and staying consistent with Keystone.\n\nJoin me: ${appLink}`;
      case 'reminder':
        return `🎯 Staying focused on what matters most. Daily discipline with Keystone.\n\nJoin me: ${appLink}`;
      default:
        return `🚀 Building the life I want, one disciplined action at a time with Keystone.\n\nJoin me: ${appLink}`;
    }
  };

  const getAlignmentCategoryTitle = (categoryId) => {
    const category = availableAlignmentCategories.find(cat => cat.id === categoryId) || 
                   alignmentCategories.find(cat => cat.id === categoryId);
    return category ? category.title.toLowerCase() : 'alignment';
  };


    const handleSharePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (shareCardRef.current) {
                 // Capture the share card as an image
         const uri = await captureRef(shareCardRef, {
           format: 'png',
           quality: 1.0,
           width: 1080,
           height: 1920, // 9:16 aspect ratio for Instagram Stories
         });

        // Share the image with a fun message
        const shareMessage = getShareMessage();
        const result = await Share.share({
          title: 'My Keystone Progress',
          message: shareMessage,
          url: uri,
        });

        if (result.action === Share.sharedAction) {
          console.log('Progress shared successfully');
          // Show success feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('Share card ref not available');
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
      
      // Fallback to app sharing if image capture fails
      try {
        const shareMessage = getShareMessage();
        await shareApp(shareMessage);
        
      } catch (fallbackError) {
        console.error('Fallback sharing also failed:', fallbackError);
        Alert.alert('Error', 'Failed to share progress. Please try again.');
      }
    }
  };

  const getAlignmentStatus = (value) => {
    if (value === null) return 'No data';
    if (value < 0.1) return 'Very Deficient';
    if (value < 0.2) return 'Deficient';
    if (value < 0.3) return 'Somewhat Deficient';
    if (value < 0.4) return 'Somewhat Aligned';
    if (value < 0.45) return 'Aligned';
    if (value < 0.5) return 'Very Aligned';
    if (value < 0.55) return 'Very Aligned';
    if (value < 0.6) return 'Aligned';
    if (value < 0.7) return 'Somewhat Aligned';
    if (value < 0.8) return 'Somewhat Excessive';
    if (value < 0.9) return 'Excessive';
    if (value < 1) return 'Very Excessive';
    return 'Excessive';
  };

  const getAlignmentColor = (value) => {
    if (value === null) return '#888';
    if (value < 0.3) return '#FF4C4C'; // Red for deficient ranges
    if (value > 0.7) return '#FF4C4C'; // Red for excessive
    return '#D4DE95'; // Green for aligned ranges
  };

  const renderShareCard = () => {
    if (loading) {
      return (
        <View style={styles.shareCard}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    console.log('ShareProgressModal - Rendering enhanced card:', {
      selectedTemplate,
      alignmentValue,
      recentActionLog,
      dailyReminder,
      availableAlignmentCategories: availableAlignmentCategories.length
    });

    // Map data to enhanced card props based on selected template
    let cardProps = {
      theme: "dark",
      variant: "trophy",
      animated: true,
      showQuote: true,
      showProgress: true,
    };

         if (selectedTemplate === 'alignment' && bestAlignmentData !== null) {
       cardProps = {
         ...cardProps,
         dayNumber: Math.round(bestAlignmentData.value * 100),
         label: bestAlignmentData.category.title.toUpperCase(),
         quote: `My ${bestAlignmentData.category.title.toLowerCase()} alignment is ${getAlignmentStatus(bestAlignmentData.value)}`,
         streakPercent: bestAlignmentData.value,
       };
    } else if (selectedTemplate === 'action' && recentActionLog) {
      cardProps = {
        ...cardProps,
        dayNumber: 1,
        label: "Action Completed",
        quote: recentActionLog.action_description || "Another step toward my goals",
        streakPercent: 1.0,
      };
    } else if (selectedTemplate === 'reminder') {
      cardProps = {
        ...cardProps,
        dayNumber: 1,
        label: "Daily Focus",
        quote: dailyReminder && dailyReminder.trim() ? dailyReminder : "Stay focused on your goals and values today",
        streakPercent: 0.8,
      };
    } else {
      // Fallback for no data
      cardProps = {
        ...cardProps,
        dayNumber: 0,
        label: "Getting Started",
        quote: "Every journey begins with a single step",
        streakPercent: 0.1,
      };
    }

    return (
      <View ref={shareCardRef} style={styles.shareCard} collapsable={false}>
        <ShareProgressCardEnhanced {...cardProps} />
      </View>
    );
  };

  const templates = [
    { id: 'alignment', title: 'My Progress', icon: 'trending-up', color: '#D4DE95' },
    { id: 'action', title: 'My Win', icon: 'checkmark-circle', color: '#FF6B35' },
    { id: 'reminder', title: 'My Focus', icon: 'bulb', color: '#4A90E2' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.horizontalBarOuter}>
          <View style={styles.horizontalBar} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={styles.title}>Share Your Progress</Text>
          <Text style={styles.description}>
            Show off your discipline and inspire others. Choose what you want to share.
          </Text>

          {/* Fun Template Selector */}
          <View style={styles.templateContainer}>
            <Text style={styles.templateTitle}>What's your flex today?</Text>
            <View style={styles.templateGrid}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate === template.id && styles.selectedTemplateCard
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTemplate(template.id);
                  }}
                >
                  <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                    <Ionicons 
                      name={template.icon} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={[
                    styles.templateText,
                    selectedTemplate === template.id && styles.selectedTemplateText
                  ]}>
                    {template.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          

          {/* Share Card Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview picture</Text>
            <View style={styles.previewWrapper}>
              {renderShareCard()}
            </View>
          </View>

        </ScrollView>

        {/* Action buttons */}
        <View style={styles.buttonContainerFixed}>
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
            <Ionicons name="share-social" size={20} color="#23272F" />
            <Text style={styles.shareButtonText}>Share Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#A1A1AA',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  templateContainer: {
    marginBottom: 24,
  },
  templateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  templateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  templateCard: {
    flex: 1,
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTemplateCard: {
    borderColor: '#D4DE95',
    backgroundColor: '#2a2a2a',
    transform: [{ scale: 1.02 }],
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  templateText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTemplateText: {
    color: '#D4DE95',
  },
  alignmentCategorySelector: {
    marginBottom: 24,
  },
  alignmentCategoryTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  alignmentCategoryScroll: {
    flexDirection: 'row',
  },
  alignmentCategoryButton: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: '#444',
  },
  selectedAlignmentCategory: {
    backgroundColor: '#D4DE95',
    borderColor: '#D4DE95',
  },
  alignmentCategoryText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  selectedAlignmentCategoryText: {
    color: '#23272F',
  },
  previewContainer: {
    marginBottom: 200,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 64,
  },
  previewWrapper: {
    alignItems: 'center',
  },
                   shareCard: {
          width: 280, // Slightly larger for better preview
          aspectRatio: 9/16, // 9:16 aspect ratio to match capture dimensions
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 16,
        },
   // Story-optimized card for sharing
   storyCard: {
     width: 1080,
     height: 1920,
     position: 'relative',
     overflow: 'hidden',
   },
   storyGradientBackground: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
   },
    gradientLayer1: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a1a',
      borderRadius: 16,
    },
    gradientLayer2: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(212, 222, 149, 0.08)',
      borderRadius: 16,
    },
    gradientLayer3: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(43, 43, 43, 0.3)',
      borderRadius: 16,
    },
    storyContentCard: {
      backgroundColor: 'rgba(43, 43, 43, 0.95)',
      borderRadius: 16,
      padding: 20, // Much more compact
      margin: 8, // Smaller margin
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      marginVertical: 100,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
   
  cardHeader: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4DE95',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 4,
  },
  alignmentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  alignmentBar: {
    width: '100%',
    marginBottom: 16,
  },
  alignmentBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    position: 'relative',
  },
  alignmentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alignmentIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#23272F',
  },
  alignmentStats: {
    alignItems: 'center',
  },
  alignmentValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4DE95',
  },
  alignmentStatus: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  actionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  actionDate: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  reminderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
  },
  cardFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
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
  shareButton: {
    backgroundColor: '#D4DE95',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#23272F',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  noKeysMessage: {
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noKeysText: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  noKeysHint: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noDataText: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataHint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
};

export default ShareProgressModal; 