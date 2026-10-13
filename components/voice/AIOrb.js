import React, { useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ORB_SHADER, GLOW_CANVAS_SCALE } from './orbShader';

// Compiled once. If a device's GPU backend rejects it, the orb falls back to a plain circle instead of crashing.
const orbEffect = Skia.RuntimeEffect.Make(ORB_SHADER);

// [listening/idle, user speaking, thinking, AI speaking]
const STATE_WEIGHTS = {
  idle: [1, 0, 0, 0],
  listening: [1, 0, 0, 0],
  userSpeaking: [0, 1, 0, 0],
  thinking: [0, 0, 1, 0],
  connecting: [0, 0, 1, 0],
  speaking: [0, 0, 0, 1],
  ended: [1, 0, 0, 0],
  error: [1, 0, 0, 0],
};

// Which level drives the orb: 0 none, 1 mic, 2 AI voice
const LEVEL_SOURCE = { userSpeaking: 1, listening: 1, speaking: 2 };

// Speech loudness from WebRTC is small (roughly 0.02 to 0.3); the square root lifts quiet speech.
const LEVEL_GAIN = 1.8;
const LEVEL_ATTACK = 18;
const LEVEL_RELEASE = 6;
const WEIGHT_RATE = 7;
const MODE_RATE = 5;
const REDUCED_MOTION_LEVEL_SCALE = 0.2;
const MAX_FRAME_SECONDS = 0.05;
const DEFAULT_FRAME_MS = 16;

const FallbackOrb = ({ size, mode }) => (
  <View
    style={{
      width: size * 0.6,
      height: size * 0.6,
      borderRadius: size * 0.3,
      backgroundColor: mode === 'question' ? '#8FA3C7' : '#D4DE95',
      opacity: 0.9,
    }}
  />
);

/**
 * The AI orb. Home shows it idle and tappable; the voice screen feeds it live levels.
 * `micLevel` / `aiLevel` are Reanimated shared values, so it redraws every frame without React renders.
 *
 * `size` is the layout box. The Canvas is larger than the box so the glow can fade out
 * instead of being cut off at a square edge.
 */
const AIOrb = ({ mode = 'affirm', state = 'idle', micLevel, aiLevel, size = 260, onPress, label }) => {
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();

  const silent = useSharedValue(0);
  const mic = micLevel ?? silent;
  const ai = aiLevel ?? silent;

  const time = useSharedValue(0);
  const level = useSharedValue(0);
  const reduced = useSharedValue(reduceMotion ? 1 : 0);
  const wIdle = useSharedValue(1);
  const wUser = useSharedValue(0);
  const wThink = useSharedValue(0);
  const wAi = useSharedValue(0);
  const weightTarget = useSharedValue(STATE_WEIGHTS.idle);
  const source = useSharedValue(0);
  const modeMix = useSharedValue(mode === 'question' ? 1 : 0);
  const modeTarget = useSharedValue(mode === 'question' ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    weightTarget.value = STATE_WEIGHTS[state] ?? STATE_WEIGHTS.idle;
    source.value = LEVEL_SOURCE[state] ?? 0;
  }, [state, weightTarget, source]);

  useEffect(() => {
    modeTarget.value = mode === 'question' ? 1 : 0;
  }, [mode, modeTarget]);

  useEffect(() => {
    reduced.value = reduceMotion ? 1 : 0;
  }, [reduceMotion, reduced]);

  // The callback must keep the same identity across renders. Reanimated re-registers a frame
  // callback whenever it changes, which restarts its clock; the voice screen re-renders constantly
  // (captions, timer), so an inline callback made the orb's animation phase snap back to zero.
  const onFrame = useCallback((info) => {
    'worklet';
    const dt = Math.min((info.timeSincePreviousFrame ?? DEFAULT_FRAME_MS) / 1000, MAX_FRAME_SECONDS);
    if (reduced.value === 0) time.value += dt;

    const raw = source.value === 1 ? mic.value : source.value === 2 ? ai.value : 0;
    const shaped = Math.min(1, Math.sqrt(Math.max(raw, 0)) * LEVEL_GAIN);
    const rate = shaped > level.value ? LEVEL_ATTACK : LEVEL_RELEASE;
    level.value += (shaped - level.value) * Math.min(1, dt * rate);

    const k = Math.min(1, dt * WEIGHT_RATE);
    const target = weightTarget.value;
    wIdle.value += (target[0] - wIdle.value) * k;
    wUser.value += (target[1] - wUser.value) * k;
    wThink.value += (target[2] - wThink.value) * k;
    wAi.value += (target[3] - wAi.value) * k;

    modeMix.value += (modeTarget.value - modeMix.value) * Math.min(1, dt * MODE_RATE);
  }, [mic, ai, time, level, reduced, source, weightTarget, wIdle, wUser, wThink, wAi, modeMix, modeTarget]);

  const frame = useFrameCallback(onFrame);

  // Tabs stay mounted in the background; don't burn the GPU when this screen isn't showing
  useEffect(() => {
    frame.setActive(isFocused);
  }, [isFocused, frame]);

  const canvasSize = size * GLOW_CANVAS_SCALE;

  const uniforms = useDerivedValue(() => ({
    size: [canvasSize, canvasSize],
    orbSize: size,
    time: time.value,
    level: reduced.value === 1 ? level.value * REDUCED_MOTION_LEVEL_SCALE : level.value,
    w: [wIdle.value, wUser.value, wThink.value, wAi.value],
    modeMix: modeMix.value,
  }));

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const orb = (
    <Animated.View
      pointerEvents="none"
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, pressStyle]}
    >
      {orbEffect ? (
        <Canvas
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: canvasSize,
            height: canvasSize,
            left: (size - canvasSize) / 2,
            top: (size - canvasSize) / 2,
          }}
        >
          <Fill>
            <Shader source={orbEffect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : (
        <FallbackOrb size={size} mode={mode} />
      )}
    </Animated.View>
  );

  if (!onPress) return orb;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => { press.value = withSpring(0.95); }}
      onPressOut={() => { press.value = withSpring(1, { damping: 8 }); }}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Start talking'}
      hitSlop={24}
    >
      {orb}
    </Pressable>
  );
};

export default React.memo(AIOrb);
