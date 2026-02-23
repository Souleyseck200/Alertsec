import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import TacticalMap from '../../components/TacticalMap';
import AgentTalkie from '../../components/AgentTalkie';
import socketService from '../../services/socket';
import { LogOut, Navigation2, Menu, Bell } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/Theme';

export default function AgentHome() {
  const { logout, user } = useAuth();
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    // Listen for voice broadcasts
    socketService.socket?.on('VOICE_BROADCAST', async (data: any) => {
      console.log('🎙️ Incoming voice broadcast...');
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/webm;base64,${Buffer.from(data.data).toString('base64')}` },
          { shouldPlay: true }
        );
        await sound.playAsync();
      } catch (err) {
        console.error('Error playing broadcast', err);
      }
    });

    return () => {
      socketService.socket?.off('VOICE_BROADCAST');
    };
  }, []);

  useEffect(() => {
    let locationSubscription: any;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      setTracking(true);
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          socketService.updateLocation(loc.coords.latitude, loc.coords.longitude);
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <TacticalMap />
      
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.badge}>
            <Navigation2 size={12} color={Colors.accentBlue} fill={Colors.accentBlue} />
            <Text style={styles.badgeText}>UNITÉ {user?.id} // OPÉRATIONNEL</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomZone}>
          <View style={styles.agentCard}>
            <Text style={styles.rank}>AGENT TACTIQUE</Text>
            <Text style={styles.name}>{user?.nom?.toUpperCase()} {user?.prenom?.toUpperCase()}</Text>
          </View>
          
          <AgentTalkie />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(9, 9, 11, 0.9)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.4)' },
  badgeText: { color: Colors.accentBlue, fontSize: 10, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },
  logoutBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(9, 9, 11, 0.9)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  bottomZone: { gap: 20, alignItems: 'center', paddingBottom: 20 },
  agentCard: { width: '100%', backgroundColor: 'rgba(9, 9, 11, 0.9)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  rank: { color: Colors.accentBlue, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  name: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 },
});
