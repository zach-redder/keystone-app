import { View, Text, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const InfoModal = ({ visible, onClose }) => {
  const keyTypes = [
    {
      icon: 'diamond',
      title: 'Core Values',
      description: 'Define who you are. These are your daily guiding principles through which you act.',
      color: '#D4DE95',
    },
    {
      icon: 'flag',
      title: 'Life Goals',
      description: 'Describe what you want to achieve in the long run. Milestones that you want to reach.',
      color: '#95C9DE',
    },
    {
      icon: 'eye',
      title: 'Future Identity',
      description: 'The identity you see for yourself in the future. The version of yourself you are aspiring to become.',
      color: '#DE95C9',
    },
    {
      icon: 'person',
      title: 'Identity Traits',
      description: 'Your unique predispositions that distinguish you from others. What makes you, you.',
      color: '#DEB595',
    },
    {
      icon: 'flash',
      title: 'Motivations',
      description: 'What drives your actions. Phrases, visions, and more that inspire you.',
      color: '#C9DE95',
    },
    {
      icon: 'warning',
      title: 'Avoidances',
      description: 'What you want nothing to do with. Something you try to steer clear from.',
      color: '#DE9595',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.dragIndicator} />
          <Text style={styles.title}>Identity Keys</Text>
          <Text style={styles.subtitle}>Understanding your key types</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {keyTypes.map((item, index) => (
            <View key={item.icon} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Create and manage your identity keys to align your daily actions with who you want to become.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(80, 80, 80, 0.35)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flex: 1,
    paddingTop: 4,
  },
  cardTitle: {
    fontSize: 19,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  footer: {
    marginTop: 12,
    padding: 20,
    backgroundColor: 'rgba(212, 222, 149, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 222, 149, 0.15)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default InfoModal;