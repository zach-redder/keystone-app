import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import { RealtimeVoiceSession } from '../services/voice/realtimeSession';
import { insertAIChatMessagePair } from '../services/features/affirmationService';

/**
 * Runs one voice conversation for a mode. Levels go into shared values so the orb can animate
 * from them on the UI thread without re-rendering this screen ten times a second.
 */
export default function useVoiceSession(mode) {
  useKeepAwake();

  const micLevel = useSharedValue(0);
  const aiLevel = useSharedValue(0);

  const [state, setState] = useState('connecting');
  const [caption, setCaption] = useState(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [ended, setEnded] = useState(false);
  const [endReason, setEndReason] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  const sessionRef = useRef(null);
  const countdownRef = useRef(null);
  // Turns are saved one after another so the chat log's `order` stays correct
  const persistChain = useRef(Promise.resolve());

  const stopCountdown = () => {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
  };

  const start = useCallback(async () => {
    setError(null);
    setEnded(false);
    setEndReason(null);
    setMuted(false);
    setCaption(null);
    setState('connecting');

    const session = new RealtimeVoiceSession(mode, {
      onState: setState,
      onCaption: setCaption,
      onLevels: ({ mic, ai }) => {
        micLevel.value = mic;
        aiLevel.value = ai;
      },
      onTurn: (turn) => {
        if (!turn.user && !turn.assistant) return;
        persistChain.current = persistChain.current
          .then(() => insertAIChatMessagePair(
            mode,
            { role: 'user', content: turn.user },
            { role: 'assistant', content: turn.assistant },
          ))
          .catch((e) => console.error('Error saving voice turn:', e));
      },
      onEnded: (reason, err) => {
        stopCountdown();
        setEnded(true);
        setEndReason(reason);
        if (err) setError({ code: err.code, message: err.message });
      },
    });
    sessionRef.current = session;

    try {
      const { maxSeconds } = await session.start();
      setSecondsLeft(maxSeconds);
      const endsAt = Date.now() + maxSeconds * 1000;
      countdownRef.current = setInterval(() => {
        setSecondsLeft(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
      }, 1000);
    } catch (e) {
      stopCountdown();
      setEnded(true);
      setError({ code: e.code ?? 'server', message: e.message ?? 'Voice is unavailable right now.' });
    }
  }, [mode, micLevel, aiLevel]);

  useEffect(() => {
    start();
    return () => {
      stopCountdown();
      sessionRef.current?.end('user');
    };
  }, [start]);

  // A call that keeps running with the screen off would keep costing money
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') sessionRef.current?.end('background');
    });
    return () => subscription.remove();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      sessionRef.current?.setMuted(!current);
      return !current;
    });
  }, []);

  const end = useCallback(() => sessionRef.current?.end('user'), []);

  return { state, caption, muted, error, ended, endReason, secondsLeft, micLevel, aiLevel, toggleMute, end, restart: start };
}
