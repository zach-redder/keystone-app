import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingKeys } from '../../../hooks/useOnboardingKeys';
import { DOUBTS, buildPreview } from '../../../services/onboarding/preview';
import { usePreAuthResume } from '../../../hooks/useOnboardingResume';

const replyCardStyle = {
  backgroundColor: 'rgba(80, 80, 80, 0.45)',
  borderRadius: 18,
  padding: 18,
  marginTop: 14,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.10)',
};

const ReplyCard = ({ icon, label, text }) => (
  <View style={replyCardStyle}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <MaterialCommunityIcons name={icon} size={20} color="#D4DE95" />
      <Text style={{ color: '#D4DE95', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>{label}</Text>
    </View>
    <Text style={{ color: '#ffffff', fontSize: 16, lineHeight: 23 }}>{text}</Text>
  </View>
);

export default function Preview() {
  const router = useRouter();
  usePreAuthResume('/onboarding/Preview');
  const { keys } = useOnboardingKeys();
  const [selectedId, setSelectedId] = useState(null);

  const preview = selectedId ? buildPreview(selectedId, keys) : null;

  const handleSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/register');
  };

  return (
    <LinearGradient
      colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 80, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.goodNewsHeader}>Try it.</Text>
        <Text style={[styles.goodNewsBody, { marginBottom: 20 }]}>
          Tap a thought you have had. Here is how Keystone answers, using your own keys.
        </Text>

        {DOUBTS.map((doubt) => (
          <TouchableOpacity
            key={doubt.id}
            style={[styles.quizOption, { width: '100%' }, selectedId === doubt.id && styles.quizOptionSelected]}
            onPress={() => handleSelect(doubt.id)}
            activeOpacity={0.9}
          >
            <Text style={styles.quizOptionText}>{doubt.text}</Text>
          </TouchableOpacity>
        ))}

        {preview ? (
          <>
            <ReplyCard icon="heart-outline" label="Affirm mode" text={preview.affirm} />
            <ReplyCard icon="help-circle-outline" label="Question mode" text={preview.question} />
            <Text style={{ color: '#b3b3b3', fontSize: 13, textAlign: 'center', marginTop: 14 }}>
              A taste of it. In the app you can talk this through with the AI, by text or by voice.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.7}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
