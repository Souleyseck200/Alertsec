import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text, 
  Dimensions 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (BUTTON_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface HoldSOSButtonProps {
  onActivate: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HoldSOSButton({ onActivate }: HoldSOSButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    setIsPressing(true);
    scale.value = withTiming(0.9, { duration: 200 });
    progress.value = withTiming(1, { duration: 3000 }, (finished) => {
      if (finished) {
        runOnJS(handleSuccess)();
      }
    });

    // Start haptic loop
    let intensity = 1;
    const interval = setInterval(() => {
      if (intensity > 3) intensity = 1; // Loop intensity
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400 - (progress.value * 300)); // Accelerating haptics
    
    // Check if we need to store interval for cleanup? 
    // Actually better to just use a ref for the interval to stop it.
  };

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onActivate();
    reset();
  };

  const cancelPress = () => {
    reset();
  };

  const reset = () => {
    setIsPressing(false);
    progress.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
  };

  const animatedCircleProps = useAnimatedStyle(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(
      progress.value,
      [0, 1],
      ['#FF3B30', '#CC2D25'],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={BUTTON_SIZE + 20} height={BUTTON_SIZE + 20} style={styles.svg}>
          {/* Background Ring */}
          <Circle
            cx={(BUTTON_SIZE + 20) / 2}
            cy={(BUTTON_SIZE + 20) / 2}
            r={RADIUS}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          {/* Progress Ring */}
          <AnimatedCircle
            cx={(BUTTON_SIZE + 20) / 2}
            cy={(BUTTON_SIZE + 20) / 2}
            r={RADIUS}
            stroke="#FFFFFF"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={animatedCircleProps as any}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${(BUTTON_SIZE + 20) / 2}, ${(BUTTON_SIZE + 20) / 2}`}
          />
        </Svg>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPressIn={startPress}
        onPressOut={cancelPress}
      >
        <Animated.View style={[styles.button, animatedButtonStyle]}>
          <ShieldAlert color="#fff" size={48} strokeWidth={2.5} />
          <Text style={styles.label}>HOLD SOS</Text>
        </Animated.View>
      </TouchableOpacity>
      
      {isPressing && (
        <Text style={styles.instruction}>Maintenez 3 secondes...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  instruction: {
    position: 'absolute',
    bottom: -40,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  svg: {
    // Correct rotation to start from top
  }
});
