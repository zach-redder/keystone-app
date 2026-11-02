import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const parseList = (raw) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing onboarding keys:', error);
    return [];
  }
};

export function useOnboardingKeys() {
  const [state, setState] = useState({
    loaded: false,
    intent: undefined,
    keys: { values: [], goals: [], vision: [] },
  });

  useEffect(() => {
    const load = async () => {
      const [intent, values, goals, vision] = await Promise.all([
        AsyncStorage.getItem('onboarding_intent'),
        AsyncStorage.getItem('core_values'),
        AsyncStorage.getItem('life_goals'),
        AsyncStorage.getItem('future_self_vision'),
      ]);
      setState({
        loaded: true,
        intent: intent ?? undefined,
        keys: { values: parseList(values), goals: parseList(goals), vision: parseList(vision) },
      });
    };
    load();
  }, []);

  return state;
}
