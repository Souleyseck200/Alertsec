import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Linking, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Phone, CheckCircle, Navigation, X, Shield, Clock, AlertTriangle, Play, Square } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { Video, Audio, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { MEDIA_ROOT } from '../services/api';

interface SOS {
  id: number;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  gravite: 'FAIBLE' | 'MOYEN' | 'CRITIQUE' | 'VITAL';
  mediaUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  citoyen?: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  dateCreation?: string | Date;
}

interface InterventionDrawerProps {
  sos: SOS | null;
  onClose: () => void;
  onAccept: (id: number) => Promise<void>;
  onCloseMission: () => Promise<void>;
  isProcessing: boolean;
  activeMissionId?: number | null;
}

export default function InterventionDrawer({ 
  sos, 
  onClose, 
  onAccept, 
  onCloseMission,
  isProcessing,
  activeMissionId
}: InterventionDrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '60%', '95%'], []);
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const isMyMission = activeMissionId === sos?.id;
  const canAccept = !activeMissionId;

  // Auto-snap to Pill if mission is active
  React.useEffect(() => {
    if (isMyMission) {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [isMyMission]);

  const formatRelativeTime = (date?: string | Date) => {
    if (!date) return "À l'instant";
    const now = new Date();
    const past = new Date(date);
    const diffInMin = Math.floor((now.getTime() - past.getTime()) / 60000);
    
    if (diffInMin < 1) return "À l'instant";
    if (diffInMin < 60) return `Il y a ${diffInMin} min`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return past.toLocaleDateString();
  };

  const handleAcceptMissionTap = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await onAccept(id);
  };

  const handleCloseMissionTap = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onCloseMission();
  };

  const handlePlayAudio = async () => {
    if (!sos?.audioUrl) return;
    try {
      if (isPlayingAudio) {
        await soundRef.current?.stopAsync();
        setIsPlayingAudio(false);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `http://172.20.10.4:3000${sos.audioUrl}` }, // Keeping host for now as MEDIA_ROOT is too specific
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setIsPlayingAudio(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
          }
        });
      }
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={1} opacity={0.5} />
  );

  if (!sos) return null;

  const handleCall = () => {
    if (sos.citoyen?.telephone) {
      Linking.openURL(`tel:${sos.citoyen.telephone}`);
    }
  };

  const getStatusColor = () => {
    switch (sos.gravite) {
      case 'VITAL': return '#ef4444';
      case 'CRITIQUE': return '#f97316';
      case 'MOYEN': return '#eab308';
      default: return '#3b82f6';
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isMyMission ? 0 : 1}
      snapPoints={snapPoints}
      enablePanDownToClose={!isMyMission}
      backdropComponent={isMyMission ? undefined : renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
      backgroundStyle={{ backgroundColor: '#09090b', borderTopWidth: 2, borderTopColor: isMyMission ? Colors.accentBlue : '#27272a' }}
      onClose={onClose}
    >
      <BottomSheetView style={styles.container}>
        {/* PILL / HEADER SUMMARY (Visible in snap index 0) */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.graviteBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.graviteText}>{sos.gravite}</Text>
            </View>
            <View>
              <Text style={styles.title}>{sos.type}</Text>
              {isMyMission && <Text style={styles.pillDistance}>📍 DISTANCE: 0.8 KM // SOS #{sos.id}</Text>}
            </View>
          </View>
          
          <View style={styles.headerRight}>
             {isMyMission ? (
               <View style={styles.activeLabel}>
                 <View style={styles.redDot} />
                 <Text style={styles.activeText}>MISSION EN COURS</Text>
               </View>
             ) : (
               <View style={styles.timerBadge}>
                <Clock color="#71717a" size={12} />
                <Text style={styles.timeText}>{formatRelativeTime(sos.dateCreation)}</Text>
              </View>
             )}
          </View>
        </View>

        {/* FULL DOSSIER CONTENT (Hidden in snap index 0 via ScrollView height/padding or conditional) */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          style={isMyMission ? { maxHeight: 500 } : undefined}
        >
          {/* IDENTITÉ ALERTEUR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALERTEUR TACTIQUE</Text>
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{sos.citoyen?.prenom?.[0]}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{sos.citoyen?.prenom} {sos.citoyen?.nom}</Text>
                <Text style={styles.userStatus}>CITOYEN VÉRIFIÉ</Text>
              </View>
              {sos.citoyen?.telephone && (
                <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                  <Phone color="#fff" size={20} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* MÉDIAS / PREUVES (Horizontal Grid as requested) */}
          {(sos.mediaUrl || sos.videoUrl || sos.audioUrl) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PIÈCES JOINTES TACTIQUES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
                {sos.mediaUrl && (
                  <View style={styles.mediaItem}>
                    <Image 
                      source={{ uri: `http://172.20.10.4:3000${sos.mediaUrl}` }} 
                      style={styles.evidenceImage} 
                      resizeMode="cover"
                    />
                  </View>
                )}
                {sos.videoUrl && (
                  <View style={styles.mediaItem}>
                    <Video
                      source={{ uri: `http://172.20.10.4:3000${sos.videoUrl}` }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      useNativeControls
                      style={styles.evidenceVideo}
                    />
                  </View>
                )}
                {sos.audioUrl && (
                  <TouchableOpacity 
                    style={[styles.audioCard, isPlayingAudio && styles.audioPlaying]} 
                    onPress={handlePlayAudio}
                  >
                    {isPlayingAudio ? <Square color="#fff" size={28} /> : <Play color={Colors.accentBlue} size={28} fill={Colors.accentBlue} />}
                    <Text style={[styles.audioLabel, isPlayingAudio && styles.audioTextPlaying]}>RAPPORT AUDIO</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETAILS DE L'INCIDENT</Text>
            <View style={styles.descCard}>
              <Text style={styles.description}>{sos.description}</Text>
            </View>
          </View>
        </ScrollView>

        {/* MASSIVE ACTION BUTTON */}
        <View style={styles.footerAction}>
          {isMyMission ? (
            <TouchableOpacity 
              style={[styles.mainActionBtn, { backgroundColor: Colors.accentGreen }]}
              onPress={() => handleCloseMissionTap()}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#000" /> : (
                <>
                  <CheckCircle color="#000" size={22} />
                  <Text style={[styles.mainActionText, { color: '#000' }]}>ARRIVÉ SUR PLACE / CLÔTURER</Text>
                </>
              )}
            </TouchableOpacity>
          ) : canAccept ? (
            <TouchableOpacity 
              style={[styles.mainActionBtn, { backgroundColor: Colors.accentBlue }]}
              onPress={() => handleAcceptMissionTap(sos.id)}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Navigation color="#fff" size={22} fill="#fff" />
                  <Text style={styles.mainActionText}>PRENDRE EN CHARGE</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedNotice}>
              <Shield color="#71717a" size={20} />
              <Text style={styles.lockedText}>ÉQUIPE DÉJÀ EN ROUTE</Text>
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  graviteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  graviteText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  pillDistance: {
    color: Colors.accentBlue,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 6,
  },
  activeText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTxt: {
    color: '#fff',
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  userStatus: {
    color: Colors.accentGreen,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  mediaRow: {
    flexDirection: 'row',
  },
  mediaItem: {
    width: 140,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  evidenceVideo: {
    width: '100%',
    height: '100%',
  },
  audioCard: {
    width: 140,
    aspectRatio: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioPlaying: {
    backgroundColor: Colors.accentBlue,
    borderColor: '#fff',
  },
  audioLabel: {
    color: Colors.accentBlue,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  audioTextPlaying: {
    color: '#fff',
  },
  descCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  description: {
    color: '#d4d4d8',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  footerAction: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  mainActionBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  mainActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lockedNotice: {
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lockedText: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
