import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import socketService from '../services/socket';
import { interventionService } from '../services/api';
import * as Haptics from 'expo-haptics';

export function useActiveMission(user: any) {
  const [activeMission, setActiveMission] = useState<any | null>(null);
  const [activeInterventionId, setActiveInterventionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [routePoints, setRoutePoints] = useState<{ latitude: number, longitude: number }[]>([]);

  // Join private room when mission is active
  useEffect(() => {
    if (activeMission?.id) {
      socketService.socket?.emit('JOIN_MISSION_ROOM', { missionId: activeMission.id });
      console.log(`🔌 [Hook] Joined mission room: room_mission_${activeMission.id}`);
    }
  }, [activeMission?.id]);

  const acceptMission = useCallback(async (sosId: number) => {
    setIsProcessing(true);
    try {
      const res = await interventionService.takeCharge(sosId);
      const mission = res.data.updatedSignalement;
      const interId = res.data.intervention.id;
      
      setActiveMission(mission);
      setActiveInterventionId(interId);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return mission;
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || 'Impossible de prendre la mission.';
      Alert.alert('ÉCHEC TACTIQUE', errorMsg);
      throw e;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const closeMission = useCallback(async () => {
    if (!activeInterventionId) return;
    setIsProcessing(true);
    try {
      await interventionService.close(activeInterventionId, "Mission terminée avec succès. Site sécurisé.");
      setActiveMission(null);
      setActiveInterventionId(null);
      setRoutePoints([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('ERREUR', 'Impossible de clôturer la mission.');
    } finally {
      setIsProcessing(false);
    }
  }, [activeInterventionId]);

  const updateRoute = useCallback((agentLoc: any, targetLoc: any) => {
    if (agentLoc && targetLoc) {
      setRoutePoints([
        { latitude: agentLoc.latitude, longitude: agentLoc.longitude },
        { latitude: Number(targetLoc.latitude), longitude: Number(targetLoc.longitude) }
      ]);
    }
  }, []);

  return {
    activeMission,
    activeInterventionId,
    isProcessing,
    routePoints,
    acceptMission,
    closeMission,
    updateRoute,
    setActiveMission,
    setRoutePoints
  };
}
