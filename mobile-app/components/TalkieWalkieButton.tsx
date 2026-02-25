import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSpring,
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Theme';
import { Audio } from 'expo-av';
import socketService from '../services/socket';

interface TalkieWalkieButtonProps {
  missionId?: number | null;
}

export default function TalkieWalkieButton({ missionId }: TalkieWalkieButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setIsPressed(true);
      scale.value = withSpring(1.2);
      ringScale.value = withRepeat(withTiming(2, { duration: 1000 }), -1, false);
      ringOpacity.value = withRepeat(withTiming(0, { duration: 1000 }), -1, false);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsPressed(false);
    scale.value = withSpring(1);
    ringScale.value = 1;
    ringOpacity.value = 0;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            socketService.sendVoiceMessage(reader.result, missionId);
            console.log(`🎙️ [TALKIE] Message sent to ${missionId ? `Mission #${missionId}` : 'Global'}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error('Stop recording error', error);
    }
    setRecording(null);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.ring, 
        ringStyle, 
        missionId ? { borderColor: Colors.accentOrange } : null
      ]} />
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={startRecording}
        onPressOut={stopRecording}
      >
        <Animated.View style={[
          styles.button, 
          animatedStyle,
          isPressed && styles.buttonPressed,
          missionId && !isPressed && styles.buttonMissionActive
        ]}>
          <Mic 
            size={24} 
            color={isPressed ? '#fff' : (missionId ? Colors.accentOrange : Colors.textMuted)} 
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonPressed: {
    backgroundColor: Colors.accentBlue,
    borderColor: '#fff',
    shadowColor: Colors.accentBlue,
    shadowOpacity: 0.5,
  },
  buttonMissionActive: {
    borderColor: Colors.accentOrange,
    borderWidth: 2,
    shadowColor: Colors.accentOrange,
    shadowOpacity: 0.3,
  },
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.accentBlue,
    zIndex: -1,
  },
});
