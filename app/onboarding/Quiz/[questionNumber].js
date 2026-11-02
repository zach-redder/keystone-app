import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingProgressHeader from '../components/OnboardingProgressHeader';
import { usePreAuthResume } from '../../../hooks/useOnboardingResume';

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "What brings you to Keystone?",
        why: "So we can start you with the right keys.",
        options: [
            { label: "I doubt myself too much", intent: "self_doubt" },
            { label: "I say yes when I mean no", intent: "people_pleasing" },
            { label: "I'm not sure which direction I'm going", intent: "direction" },
            { label: "I start strong, then fall off", intent: "follow_through" }
        ]
    },
    {
        id: 2,
        question: "How often do you doubt yourself?",
        why: "It helps us set the tone of your reminders.",
        options: [
            { label: "Always" },
            { label: "Often" },
            { label: "Sometimes" },
            { label: "Rarely" }
        ]
    },
    {
        id: 3,
        question: "When you fall off track, what do you tend to do?",
        why: "No judgment. This shapes how we nudge you back.",
        options: [
            { label: "Get back up immediately" },
            { label: "Restart the next day" },
            { label: "Wait for Monday" },
            { label: "Give up" }
        ]
    },
    {
        id: 4,
        question: "When do you most need a nudge?",
        why: "We will use this for your reminders.",
        options: [
            { label: "In the morning", nudge: "morning" },
            { label: "In the moment doubt hits", nudge: "moment" },
            { label: "In the evening", nudge: "evening" }
        ]
    }
];

export default function QuizQuestion() {
    const router = useRouter();
    const { questionNumber } = useLocalSearchParams();
    usePreAuthResume(`/onboarding/Quiz/${questionNumber}`);
    const currentQuestionIndex = parseInt(questionNumber) - 1;
    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    
    const fadeValue = useRef(new Animated.Value(0)).current;
    const slideValue = useRef(new Animated.Value(30)).current;
    const [selectedOption, setSelectedOption] = useState(null);
    const [tappedOption, setTappedOption] = useState(null);

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeValue, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideValue, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // Load any previously saved answer
        loadPreviousAnswer();
    }, [questionNumber]);

    const loadPreviousAnswer = async () => {
        try {
            const savedAnswers = await AsyncStorage.getItem('quiz_answers');
            if (savedAnswers) {
                const answers = JSON.parse(savedAnswers);
                const savedAnswer = answers[`question_${questionNumber}`];
                if (savedAnswer) {
                    setSelectedOption(savedAnswer);
                }
            }
        } catch (error) {
            console.error('Error loading previous answer:', error);
        }
    };

    const handleOptionSelect = async (selected, optionIndex) => {
        const option = selected.label;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTappedOption(option);
        setSelectedOption(option);
        
        // Save answer to AsyncStorage
        try {
            const savedAnswers = await AsyncStorage.getItem('quiz_answers');
            const answers = savedAnswers ? JSON.parse(savedAnswers) : {};
            answers[`question_${questionNumber}`] = option;
            answers[`question_${questionNumber}_score`] = optionIndex; // Store numeric score too
            await AsyncStorage.setItem('quiz_answers', JSON.stringify(answers));
            if (selected.intent) await AsyncStorage.setItem('onboarding_intent', selected.intent);
            if (selected.nudge) await AsyncStorage.setItem('onboarding_nudge', selected.nudge);
        } catch (error) {
            console.error('Error saving quiz answer:', error);
        }

        // Auto-transition after selection (faster transition)
        setTimeout(async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const nextQuestionNum = parseInt(questionNumber) + 1;
            if (nextQuestionNum <= QUIZ_QUESTIONS.length) {
                router.push(`/onboarding/Quiz/${nextQuestionNum}`);
            } else {
                // Quiz completed
                router.push('/onboarding/CoreValues');
            }
        }, 400);
    };

    const handleSkipQuiz = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/CoreValues');
    };

    if (!currentQuestion) {
        return (
            <LinearGradient
                colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
                style={styles.gradientContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <OnboardingProgressHeader />
                <View style={styles.centerContainer}>
                    <Text style={styles.title}>Question not found</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#2B2B2B', '#2F2F2C', '#2B2B2B']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <OnboardingProgressHeader />
            <Animated.View 
                style={[
                    styles.quizContainer,
                    {
                        opacity: fadeValue,
                        transform: [{ translateY: slideValue }]
                    }
                ]}
            >
                <Text style={styles.quizQuestionNumber}>
                    {questionNumber} of {QUIZ_QUESTIONS.length}
                </Text>
                
                <Text style={styles.quizQuestion}>
                    {currentQuestion.question}
                </Text>

                <Text style={{ color: '#b3b3b3', fontSize: 15, textAlign: 'center', marginBottom: 20 }}>
                    {currentQuestion.why}
                </Text>

                <View style={{ width: '100%', flex: 1 }}>
                    {currentQuestion.options.map(({ label: option }, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.quizOption,
                                selectedOption === option && styles.quizOptionSelected,
                                tappedOption === option && styles.quizOptionTapped
                            ]}
                            onPress={() => handleOptionSelect(currentQuestion.options[index], index)}
                            activeOpacity={0.9}
                        >
                            <Text style={[
                                styles.quizOptionText,
                                selectedOption === option && styles.quizOptionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Skip Quiz Button - positioned at bottom */}
                <TouchableOpacity 
                    style={styles.skipQuizButton}
                    onPress={handleSkipQuiz}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipQuizText}>Skip Quiz</Text>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}