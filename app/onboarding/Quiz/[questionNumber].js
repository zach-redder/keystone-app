import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from '../../../styles/onboarding';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingProgressHeader from '../OnboardingProgressHeader';

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "How often do you stay true to your word?",
        options: [
            "Always",
            "Often",
            "Sometimes",
            "Never"
        ]
    },
    {
        id: 2,
        question: "How often do you say yes to people when you mean no?",
        options: [
            "Always",
            "Often",
            "Sometimes",
            "Never"
        ]
    },
    {
        id: 3,
        question: "How often do you keep your dreams & goals hidden?",
        options: [
            "Always",
            "Often",
            "Sometimes",
            "Never"
        ]
    },
    {
        id: 4,
        question: "How often do you avoid difficult conversations?",
        options: [
            "Always",
            "Often",
            "Sometimes",
            "Never"
        ]
    },
    {
        id: 5,
        question: "When you fall off track what do you tend to do?",
        options: [
            "Get back up immediately",
            "Restart the next day",
            "Wait for Monday",
            "Give up"
        ]
    },
    {
        id: 6,
        question: "How often do you doubt yourself?",
        options: [
            "Always",
            "Often",
            "Sometimes",
            "Never"
        ]
    }
];

export default function QuizQuestion() {
    const router = useRouter();
    const { questionNumber } = useLocalSearchParams();
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

    const handleOptionSelect = async (option, optionIndex) => {
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
        } catch (error) {
            console.error('Error saving quiz answer:', error);
        }

        // Auto-transition after selection (faster transition)
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const nextQuestionNum = parseInt(questionNumber) + 1;
            if (nextQuestionNum <= 6) {
                router.push(`/onboarding/Quiz/${nextQuestionNum}`);
            } else {
                // Quiz completed, go to user info screen
                router.push('/onboarding/Quiz/UserInfo');
            }
        }, 400);
    };

    const handleSkipQuiz = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding/FutureSelfVision');
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
                    Question {questionNumber} of 6
                </Text>
                
                <Text style={styles.quizQuestion}>
                    {currentQuestion.question}
                </Text>

                <View style={{ width: '100%', flex: 1 }}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.quizOption,
                                selectedOption === option && styles.quizOptionSelected,
                                tappedOption === option && styles.quizOptionTapped
                            ]}
                            onPress={() => handleOptionSelect(option, index)}
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