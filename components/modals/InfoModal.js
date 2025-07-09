import { View, Text, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import keysStyles from '../../styles/keys';

const InfoModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={keysStyles.infoModalContainer}>
        <View style={keysStyles.horizontalBar} />
        <ScrollView style={keysStyles.infoContent}>
          <Text style={keysStyles.infoSectionTitle}>More Info</Text>
          
          <View style={keysStyles.infoItem}>
            <Ionicons name="diamond" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Core Values </Text>
                define who you are. These are your daily guiding principles through which you act.
              </Text>
            </View>
          </View>

          <View style={keysStyles.infoItem}>
            <Ionicons name="flag" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Life Goals </Text>
                describe what you want to achieve in the long run. Milestones that you want to reach.
              </Text>
            </View>
          </View>

          <View style={keysStyles.infoItem}>
            <Ionicons name="eye" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Future Identity </Text>
                is the identity you see for yourself in the future. The version of yourself you are aspiring to become.
              </Text>
            </View>
          </View>

          <View style={keysStyles.infoItem}>
            <Ionicons name="person" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Identity Traits </Text>
                are your unique predispositions that distinguish you from others. What makes you, you.
              </Text>
            </View>
          </View>

          <View style={keysStyles.infoItem}>
            <Ionicons name="flash" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Motivations </Text>
                are what drive your actions. Phrases, visions, and more that inspire you.
              </Text>
            </View>
          </View>

          <View style={[keysStyles.infoItem, { marginBottom: 40 }]}>
            <Ionicons name="warning" size={16} color="#fff" style={keysStyles.infoItemIcon} />
            <View style={keysStyles.infoTextContainer}>
              <Text style={keysStyles.infoItemText}>
                <Text style={keysStyles.infoItemTitle}>Avoidances </Text>
                are what you want nothing to do with. Something you try to steer clear from.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default InfoModal;