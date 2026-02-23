import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableHighlight, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ShieldAlert } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface SOSButtonProps {
  onSOS: () => void;
}

export default function SOSButton({ onSOS }: SOSButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        triggerSOS();
      }
    });
  };

  const handlePressOut = () => {
    setIsPressing(false);
    Animated.spring(progress, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const triggerSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    onSOS();
    handlePressOut();
  };

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progressRing, { 
        transform: [{ scale }, { rotate }],
        borderRightColor: Colors.accentRed,
        borderTopColor: Colors.accentRed,
        opacity: isPressing ? 1 : 0
      }]} />
      
      <TouchableHighlight
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        underlayColor="#7f1d1d"
        style={styles.button}
      >
        <View style={styles.inner}>
          <ShieldAlert size={32} color="#fff" />
          <Text style={styles.text}>
            {isPressing ? 'TENIR 3S' : 'SOS'}
          </Text>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  progressRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#991b1b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  inner: {
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },
});
