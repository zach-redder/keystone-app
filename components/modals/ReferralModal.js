import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserReferralInfo } from '../../services/user/referralService';

const ReferralModal = ({ visible, onClose }) => {
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReferralData();
    }
  }, [visible]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const referralInfo = await getUserReferralInfo();
      setReferralInfo(referralInfo);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const appLink = 'https://thekeystoneapp.com'; // Fallback link
      await Clipboard.setString(appLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleShareLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const appLink = 'https://thekeystoneapp.com'; // Fallback link
      const result = await Share.share({
        title: 'Get Keystone Pro for Free!',
        message: `🎉 Get 1 month of Keystone Pro FREE when you download using this link!\n${appLink}`,
        url: appLink,
      });
      if (result.action === Share.sharedAction) {
        console.log('Referral link shared successfully');
      }
    } catch (error) {
      console.error('Error sharing referral link:', error);
      Alert.alert('Error', 'Failed to share referral link. Please try again.');
    }
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.horizontalBarOuter}>
          <View style={styles.horizontalBar} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift" size={48} color="#D4DE95" />
            </View>
            <Text style={styles.heroTitle}>Earn Free Pro Months!</Text>
            <Text style={styles.heroDescription}>
              Share your unique link and get 1 free month of Keystone Pro for each person who downloads the app up to 6 people!
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{referralInfo ? '1' : '0'}</Text>
                <Text style={styles.statLabel}>Referral Used</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{referralInfo ? '1' : '0'}</Text>
                <Text style={styles.statLabel}>Free Months</Text>
              </View>
            </View>
          </View>

          {/* Link Section */}
          <View style={styles.linkSection}>
            <Text style={styles.linkTitle}>Your Referral Link</Text>
            <TouchableOpacity style={styles.linkContainer} onPress={handleCopyLink}>
              <Text style={styles.linkText} numberOfLines={2}>
                https://thekeystoneapp.com
              </Text>
              <View style={styles.copyIndicator}>
                <Ionicons name={copied ? "checkmark" : "copy"} size={20} color={copied ? "#D4DE95" : "#A1A1AA"} />
              </View>
            </TouchableOpacity>
            {copied && (
              <Text style={styles.copiedText}>Link copied!</Text>
            )}
          </View>

          {/* Instructions Section */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to Share</Text>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="copy" size={20} color="#D4DE95" />
              </View>
              <Text style={styles.instructionText}>
                Copy your referral link above
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="share-social" size={20} color="#D4DE95" />
              </View>
              <Text style={styles.instructionText}>
                Post it on your Instagram story, other socials, or share with friends
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="download" size={20} color="#D4DE95" />
              </View>
              <Text style={styles.instructionText}>
                When someone downloads using your link, you both get 1 free month!
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it Works</Text>
            <Text style={styles.infoText}>
              • You can earn up to 6 free months total{'\n'}
              • Each download gives you 1 free month{'\n'}
              • The person who downloads also gets 1 free month{'\n'}
              • No self-referrals allowed{'\n'}
              • You can only earn 1 free month per person
            </Text>
          </View>
        </ScrollView>

        {/* Sticky Share Button */}
        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
            <Ionicons name="share" size={20} color="#232323" />
            <Text style={styles.shareButtonText}>Share Link</Text>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C3C3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4DE95',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  linkSection: {
    marginBottom: 32,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#D4DE95',
    marginRight: 12,
  },
  copyIndicator: {
    padding: 8,
  },
  copiedText: {
    fontSize: 12,
    color: '#D4DE95',
    textAlign: 'center',
    marginTop: 8,
  },
  instructionsSection: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3C3C3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#A1A1AA',
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4DE95',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    marginTop: 24,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#232323',
    marginLeft: 8,
  },
  infoSection: {
    marginBottom: 48,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2B2B2B',
    borderTopWidth: 1,
    borderTopColor: '#3C3C3C',
  },
};

export default ReferralModal; 