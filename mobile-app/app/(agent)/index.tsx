import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import TacticalMap from '../../components/TacticalMap';
import TacticalHUD from '../../components/TacticalHUD';
import MissionToast from '../../components/MissionToast';
import TalkieWalkieButton from '../../components/TalkieWalkieButton';
import InterventionDrawer from '../../components/InterventionDrawer';
import socketService from '../../services/socket';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/Theme';
import { useActiveMission } from '../../hooks/useActiveMission';

export default function AgentHome() {
  const { user } = useAuth();
  const [newMissionAlert, setNewMissionAlert] = useState<any | null>(null);
  const [selectedSOS, setSelectedSOS] = useState<any | null>(null);

  // Hook handles: activeMission, activeInterventionId, isProcessing, routePoints, acceptMission, closeMission
  const mission = useActiveMission(user);

  useEffect(() => {
    // Listen for voice broadcasts
    socketService.socket?.on('VOICE_BROADCAST', async (data: any) => {
      console.log('🎙️ [VOICE] Incoming broadcast from:', data.from);
      try {
        if (!data.data || typeof data.data !== 'string') return;
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: data.data },
          { shouldPlay: true }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didFinish) {
            sound.unloadAsync();
          }
        });
      } catch (err: any) {
        console.error('❌ [VOICE] Error playing broadcast:', err.message);
      }
    });

    // Listen for new SOS alerts
    socketService.socket?.on('NOUVEAU_SIGNALEMENT', (data: any) => {
      if (mission.activeMission) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setNewMissionAlert(data);
    });

    return () => {
      socketService.socket?.off('VOICE_BROADCAST');
      socketService.socket?.off('NOUVEAU_SIGNALEMENT');
    };
  }, [mission.activeMission]);

  useEffect(() => {
    let locationSubscription: any;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          socketService.updateLocation(loc.coords.latitude, loc.coords.longitude);
          if (mission.activeMission) {
            mission.updateRoute(loc.coords, mission.activeMission);
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [mission.activeMission]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <TacticalMap 
        onSOSSelect={setSelectedSOS} 
        activeMissionId={mission.activeMission?.id}
        routePoints={mission.routePoints}
      />
      
      <TacticalHUD isMissionActive={!!mission.activeMission} />

      <MissionToast 
        alert={newMissionAlert} 
        onHide={() => setNewMissionAlert(null)}
        onDetails={() => {
          setSelectedSOS(newMissionAlert);
          setNewMissionAlert(null);
        }}
        onPress={async () => {
          if (newMissionAlert) {
            await mission.acceptMission(newMissionAlert.id);
            setNewMissionAlert(null);
          }
        }}
      />

      <TalkieWalkieButton missionId={mission.activeMission?.id} />

      {(selectedSOS || mission.activeMission) && (
        <InterventionDrawer 
          sos={selectedSOS || mission.activeMission}
          onClose={() => setSelectedSOS(null)}
          onAccept={mission.acceptMission}
          onCloseMission={mission.closeMission}
          isProcessing={mission.isProcessing}
          activeMissionId={mission.activeMission?.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
