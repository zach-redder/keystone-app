import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import { RealtimeVoiceSession } from '../services/voice/realtimeSession';
import { insertAIChatMessagePair } from '../services/features/affirmationService';
import { detectCrisis } from '../services/safety/crisisDetection';

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
  const [remainingMessages, setRemainingMessages] = useState(null);
  // Spoken input is only transcribed after the model has heard it, so the resources appear alongside its reply
  const [crisisDetected, setCrisisDetected] = useState(false);

  const sessionRef = useRef(null);
  const mutedRef = useRef(false);
  const countdownRef = useRef(null);
  // Turns are saved one after another so the chat log's `order` stays correct
  const persistChain = useRef(Promise.resolve());

  const stopCountdown = () => {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
  };

  const start = useCallback(async () => {
    // A restart must not leave the previous call running behind the new one
    const previous = sessionRef.current;
    sessionRef.current = null;
    stopCountdown();
    if (previous) await previous.end('user');

    setError(null);
    setEnded(false);
    setEndReason(null);
    setMuted(false);
    mutedRef.current = false;
    setCaption(null);
    setState('connecting');
    setSecondsLeft(null);
    setRemainingMessages(null);

    // Callbacks from a session that has been replaced are ignored
    const current = () => sessionRef.current === session;
    const session = new RealtimeVoiceSession(mode, {
      onState: (next) => { if (current()) setState(next); },
      onCaption: (next) => { if (current()) setCaption(next); },
      onLevels: ({ mic, ai }) => {
        if (!current()) return;
        micLevel.value = mic;
        aiLevel.value = ai;
      },
      onRemainingMessages: (next) => { if (current()) setRemainingMessages(next); },
      onTurn: (turn) => {
        if (!turn.user && !turn.assistant) return;
        if (current() && detectCrisis(turn.user)) setCrisisDetected(true);
        persistChain.current = persistChain.current
          .then(() => insertAIChatMessagePair(
            mode,
            { role: 'user', content: turn.user },
            { role: 'assistant', content: turn.assistant },
          ))
          .catch((e) => console.error('Error saving voice turn:', e));
      },
      onEnded: (reason, err) => {
        if (!current()) return;
        stopCountdown();
        setEnded(true);
        setEndReason(reason);
        if (err) setError({ code: err.code, message: err.message });
      },
    });
    sessionRef.current = session;

    try {
      const { maxSeconds } = await session.start();
      if (!current()) return;
      setSecondsLeft(maxSeconds);
      const endsAt = Date.now() + maxSeconds * 1000;
      countdownRef.current = setInterval(() => {
        setSecondsLeft(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
      }, 1000);
    } catch (e) {
      // The user closed the screen mid-connect; nothing to report
      if (e?.code === 'aborted' || !current()) return;
      stopCountdown();
      setEnded(true);
      setError({ code: e.code ?? 'server', message: e.message ?? 'Voice is unavailable right now.' });
    }
  }, [mode, micLevel, aiLevel]);

  useEffect(() => {
    start();
    return () => {
      stopCountdown();
      const session = sessionRef.current;
      sessionRef.current = null;
      session?.end('user');
    };
  }, [start]);

  // A call that keeps running with the screen off would keep costing money. `inactive` is not
  // included: iOS reports it while the microphone permission prompt is up, which is not leaving.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') sessionRef.current?.end('background');
    });
    return () => subscription.remove();
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    sessionRef.current?.setMuted(next);
    setMuted(next);
  }, []);

  const end = useCallback(() => sessionRef.current?.end('user'), []);
  const dismissCrisis = useCallback(() => setCrisisDetected(false), []);

  return {
    state, caption, muted, error, ended, endReason, secondsLeft, remainingMessages, micLevel, aiLevel,
    crisisDetected, dismissCrisis, toggleMute, end, restart: start,
  };
}
