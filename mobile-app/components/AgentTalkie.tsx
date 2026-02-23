import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Radio } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import socketService from '../services/socket';

export default function AgentTalkie() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  async function startRecording() {
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
      setIsTalking(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsTalking(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            socketService.sendVoiceMessage(reader.result);
            console.log('🎙️ Voice message sent');
          }
        };
        reader.readAsArrayBuffer(blob);
      }
    } catch (error) {
      console.error('Stop recording error', error);
    }
    setRecording(null);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onLongPress={startRecording}
        onPressOut={stopRecording}
        style={[styles.btn, isTalking && styles.active]}
      >
        {isTalking ? <Mic size={32} color="#fff" /> : <Radio size={32} color={Colors.accentBlue} />}
        <Text style={styles.text}>{isTalking ? 'RETRANSMISSION...' : 'HOLD TO TALK'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  btn: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  active: { backgroundColor: Colors.accentBlue, borderColor: '#fff' },
  text: { color: Colors.textMuted, fontSize: 10, fontWeight: '900', marginTop: 10 }
});
