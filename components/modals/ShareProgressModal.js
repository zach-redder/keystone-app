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
import { shareApp } from '../../services/shareService';
import { fetchAlignmentValue } from '../../services/alignmentService';
import { fetchRecentActionLog } from '../../services/actionLogs';
import { fetchTodayReminder } from '../../services/reminderService';
import { fetchIdentityKeys } from '../../services/userKeys';
import { getAppStoreLink } from '../../constants/appStore';
import { getReferralLink, getReferralStats } from '../../services/referralService';
import ReferralModal from './ReferralModal';

const ShareProgressModal = ({ visible, onClose }) => {
  const shareCardRef = useRef(null);
  
  const [alignmentValue, setAlignmentValue] = useState(null);
  const [recentActionLog, setRecentActionLog] = useState(null);
  const [dailyReminder, setDailyReminder] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('alignment');
  const [selectedAlignmentCategory, setSelectedAlignmentCategory] = useState('core_values');
  const [loading, setLoading] = useState(true);
  const [availableAlignmentCategories, setAvailableAlignmentCategories] = useState([]);
  const [referralStats, setReferralStats] = useState({ downloads_count: 0, free_months_earned: 0, next_reward_at: 1 });
  const [referralLink, setReferralLink] = useState('');
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
  }, [visible, selectedAlignmentCategory]);

  // Filter alignment categories based on user keys
  const filterAlignmentCategories = async () => {
    try {
      const userKeys = await fetchIdentityKeys();
      const userCategories = [...new Set(userKeys.map(key => key.category))];
      
      const filteredCategories = alignmentCategories.filter(category => 
        userCategories.includes(category.id)
      );
      
      setAvailableAlignmentCategories(filteredCategories);
      
      // Update selected category if current selection is not available
      if (filteredCategories.length > 0 && !filteredCategories.find(cat => cat.id === selectedAlignmentCategory)) {
        setSelectedAlignmentCategory(filteredCategories[0].id);
      }
    } catch (error) {
      console.error('Error filtering alignment categories:', error);
      setAvailableAlignmentCategories([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Filter alignment categories first
      await filterAlignmentCategories();
      
      const [alignment, actionLog, reminder, stats, link] = await Promise.all([
        fetchAlignmentValue(selectedAlignmentCategory),
        fetchRecentActionLog(),
        fetchTodayReminder(),
        getReferralStats(),
        getReferralLink(),
      ]);
      
      console.log('ShareProgressModal - Loaded data:', {
        alignment,
        actionLog,
        reminder,
        stats,
        link,
        selectedAlignmentCategory,
        availableAlignmentCategories: availableAlignmentCategories.length
      });
      
      setAlignmentValue(alignment);
      setRecentActionLog(actionLog);
      setDailyReminder(reminder);
      setReferralStats(stats);
      setReferralLink(link);
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
        return `Check out my ${getAlignmentCategoryTitle(selectedAlignmentCategory)} alignment on Keystone!\n\nDownload the app: ${appLink}`;
      case 'action':
        return `Check out my recent action on Keystone!\n\nDownload the app: ${appLink}`;
      case 'reminder':
        return `Check out my daily reminder on Keystone!\n\nDownload the app: ${appLink}`;
      default:
        return `Check out my progress on Keystone!\n\nDownload the app: ${appLink}`;
    }
  };

  const getAlignmentCategoryTitle = (categoryId) => {
    const category = availableAlignmentCategories.find(cat => cat.id === categoryId) || 
                   alignmentCategories.find(cat => cat.id === categoryId);
    return category ? category.title.toLowerCase() : 'alignment';
  };


  const handleSharePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const shareMessage = getShareMessage();
    
    try {
      if (shareCardRef.current) {
                 // Capture the share card as an image with phone screen proportions
         const uri = await captureRef(shareCardRef, {
           format: 'png',
           quality: 1.0,
           width: 1080,
           height: 1920, // Phone screen aspect ratio (9:16)
         });

        // Share the image
        const result = await Share.share({
          title: 'My Keystone Progress',
          message: shareMessage,
          url: uri,
        });

        if (result.action === Share.sharedAction) {
          console.log('Progress shared successfully');
        }
      } else {
        // Fallback to app sharing
        await shareApp(shareMessage);
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
      
      // Try fallback sharing if image capture fails
      try {
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

    console.log('ShareProgressModal - Rendering card:', {
      selectedTemplate,
      alignmentValue,
      recentActionLog,
      dailyReminder,
      availableAlignmentCategories: availableAlignmentCategories.length
    });

     return (
       <View ref={shareCardRef} style={styles.shareCard}>
         {/* Cool gradient background */}
         <View style={styles.storyGradientBackground}>
           <View style={styles.gradientLayer1} />
           <View style={styles.gradientLayer2} />
           <View style={styles.gradientLayer3} />
         </View>
         
                  {/* Content Card */}
         <View style={styles.storyContentCard}>
           {/* Header */}
           <View style={styles.cardHeader}>
             <Text style={styles.appName}>Keystone</Text>
             <Text style={styles.cardSubtitle}>Overcome Doubt</Text>
           </View>

           {/* Content based on selected template */}
           {selectedTemplate === 'alignment' && (
             <View style={styles.alignmentContent}>
               {alignmentValue !== null && availableAlignmentCategories.length > 0 ? (
                 <>
                   <Text style={styles.alignmentTitle}>
                     My {getAlignmentCategoryTitle(selectedAlignmentCategory).replace(/\b\w/g, l => l.toUpperCase())}
                   </Text>
                   <View style={styles.alignmentBar}>
                     <View style={styles.alignmentBarBg}>
                       <View 
                         style={[
                           styles.alignmentBarFill,
                           { 
                             width: `${alignmentValue * 100}%`,
                             backgroundColor: getAlignmentColor(alignmentValue)
                           }
                         ]} 
                       />
                       <View 
                         style={[
                           styles.alignmentIndicator,
                           { 
                             left: `${Math.max(0, Math.min(100, alignmentValue * 100))}%`,
                             transform: [{ translateX: -8 }],
                             backgroundColor: getAlignmentColor(alignmentValue)
                           }
                         ]} 
                       />
                     </View>
                   </View>
                   <View style={styles.alignmentStats}>
                     <Text style={[styles.alignmentStatus, { color: getAlignmentColor(alignmentValue) }]}>
                       {getAlignmentStatus(alignmentValue)}
                     </Text>
                   </View>
                 </>
               ) : (
                 <>
                   <Text style={styles.alignmentTitle}>No Alignment Data</Text>
                   <Text style={styles.noDataText}>
                     Add some keys to see your alignment progress.
                   </Text>
                 </>
               )}
             </View>
           )}

           {selectedTemplate === 'action' && (
             <View style={styles.actionContent}>
               <Text style={styles.actionTitle}>My Recent Action</Text>
               {recentActionLog ? (
                 <>
                   <Text style={styles.actionText} numberOfLines={3}>
                     {recentActionLog.action_description || 'No action logged'}
                   </Text>
                   <Text style={styles.actionDate}>
                     {new Date(recentActionLog.created_at).toLocaleDateString()}
                   </Text>
                 </>
               ) : (
                 <Text style={styles.noDataText}>
                   No action logs found. Log your first action to see it here.
                 </Text>
               )}
             </View>
           )}

           {selectedTemplate === 'reminder' && (
             <View style={styles.reminderContent}>
               <Text style={styles.reminderTitle}>My Daily Reminder</Text>
               <Text style={styles.reminderText}>
                 {dailyReminder || "Stay focused on your goals and values today."}
               </Text>
             </View>
           )}

           {/* Footer */}
           <View style={styles.cardFooter}>
             <Text style={styles.footerText}>Achieve your dreams at</Text>
             <Text style={styles.footerSubtext}>thekeystoneapp.com</Text>
           </View>
         </View>
       </View>
     );
   };

   const templates = [
    { id: 'alignment', title: 'Alignment', icon: 'trending-up' },
    { id: 'action', title: 'Action Log', icon: 'checkmark-circle' },
    { id: 'reminder', title: 'Daily Reminder', icon: 'bulb' },
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
          <Text style={styles.title}>Share Progress</Text>
          <Text style={styles.description}>
            Start caring less about what people think by sharing your alignment progress publicly.
          </Text>

          {/* Template Selector */}
          <View style={styles.templateContainer}>
            <Text style={styles.templateTitle}>Choose Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateButton,
                    selectedTemplate === template.id && styles.selectedTemplate
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTemplate(template.id);
                  }}
                >
                  <Ionicons 
                    name={template.icon} 
                    size={24} 
                    color={selectedTemplate === template.id ? '#23272F' : '#888'} 
                  />
                  <Text style={[
                    styles.templateText,
                    selectedTemplate === template.id && styles.selectedTemplateText
                  ]}>
                    {template.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Alignment Category Selector - Only show when alignment template is selected and user has keys */}
          {selectedTemplate === 'alignment' && availableAlignmentCategories.length > 0 && (
            <View style={styles.alignmentCategorySelector}>
              <Text style={styles.alignmentCategoryTitle}>Choose Alignment Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alignmentCategoryScroll}>
                {availableAlignmentCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.alignmentCategoryButton,
                      selectedAlignmentCategory === category.id && styles.selectedAlignmentCategory
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAlignmentCategory(category.id);
                    }}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={24} 
                      color={selectedAlignmentCategory === category.id ? '#23272F' : '#888'} 
                    />
                    <Text style={[
                      styles.alignmentCategoryText,
                      selectedAlignmentCategory === category.id && styles.selectedAlignmentCategoryText
                    ]}>
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Message when alignment template is selected but user has no keys */}
          {selectedTemplate === 'alignment' && availableAlignmentCategories.length === 0 && (
            <View style={styles.noKeysMessage}>
              <Text style={styles.noKeysText}>
                You need to add some keys first to share your alignment progress.
              </Text>
            </View>
          )}

            {/* Share Card Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewWrapper}>
                {renderShareCard()}
              </View>
            </View>


        </ScrollView>

        {/* Action buttons */}
        <View style={styles.buttonContainerFixed}>
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
            <Ionicons name="share-social" size={20} color="#23272F" />
            <Text style={styles.shareButtonText}>Share</Text>
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
    marginBottom: 20,
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
  templateScroll: {
    flexDirection: 'row',
  },
  templateButton: {
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#444',
  },
  selectedTemplate: {
    backgroundColor: '#D4DE95',
    borderColor: '#D4DE95',
  },
  templateText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  selectedTemplateText: {
    color: '#23272F',
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
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: '#444',
  },
  selectedAlignmentCategory: {
    backgroundColor: '#D4DE95',
    borderColor: '#D4DE95',
  },
  alignmentCategoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  selectedAlignmentCategoryText: {
    color: '#23272F',
  },
  previewContainer: {
    marginBottom: 140,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  previewWrapper: {
    alignItems: 'center',
  },
    shareCard: {
        backgroundColor: '#2B2B2B',
        borderRadius: 16,
        padding: 24,
        width: 320, // Card width
        aspectRatio: 9/16, // Phone screen aspect ratio (9:16)
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#444',
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
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 4,
  },
  footerSubtext: {
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
  noDataText: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
};

export default ShareProgressModal; 