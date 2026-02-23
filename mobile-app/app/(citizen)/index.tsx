import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Text, 
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ShieldAlert, 
  Plus, 
  Navigation, 
  Siren, 
  Layers,
  LocateFixed
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { uberBlackMapStyle } from '../../constants/MapStyle';
import { Colors } from '../../constants/Theme';
import { signalementService } from '../../services/api';
import ReportBottomSheet from '../../components/ReportBottomSheet';

const { width, height } = Dimensions.get('window');

const MOCK_AGENTS = [
  { id: 1, lat: 14.6937, lng: -17.4441, type: 'POLICE' },
  { id: 2, lat: 14.6950, lng: -17.4480, type: 'SIREN' },
  { id: 3, lat: 14.6910, lng: -17.4500, type: 'POLICE' },
];

export default function CitizenHome() {
  const [showSheet, setShowSheet] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 14.6937, // Dakar par défaut
    longitude: -17.4441,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for user marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 2.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Location logic
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Accès refusé', 'L\'autorisation de localisation est requise pour utiliser la carte tactique.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setUserLocation(location);
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 2000);
    })();
  }, []);

  const handleSOS = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (!userLocation) {
      Alert.alert('ERREUR GPS', 'Impossible de lancer un SOS sans localisation.');
      return;
    }

    try {
      console.log('📡 [MobileSOS] Sending VITAL SOS...');
      const formData = new FormData();
      formData.append('type', 'AUTRE');
      formData.append('description', 'URGENCE VITALE DÉCLENCHÉE (SOS AUTO)');
      formData.append('latitude', userLocation.coords.latitude.toString());
      formData.append('longitude', userLocation.coords.longitude.toString());
      formData.append('gravite', 'VITAL');
      formData.append('type_entree', 'SOS_AUTO');

      const res = await signalementService.create(formData);
      console.log('✅ [MobileSOS] SOS Success:', res.data);
      Alert.alert('MODE SOS ACTIVÉ', 'Alerte automatique envoyée au centre de commandement. Les unités convergent vers votre position.');
    } catch (error) {
       console.error('SOS failed:', error);
       Alert.alert('ÉCHEC SOS', 'Le système n\'a pas pu transmettre l\'alerte vitale au réseau.');
    }
  };

  const handleManualAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSheet(true);
  };

  const moveToUserLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const handleReportSubmit = async (data: any) => {
    try {
      if (!userLocation) {
        Alert.alert('Erreur', 'Position inconnue. Impossible de signaler.');
        return;
      }

      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('description', data.description);
      formData.append('latitude', userLocation.coords.latitude.toString());
      formData.append('longitude', userLocation.coords.longitude.toString());
      formData.append('gravite', 'MOYEN'); // Par défaut pour manuel
      formData.append('type_entree', 'MANUEL');

      if (data.images && data.images.length > 0) {
        const uri = data.images[0];
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        // @ts-ignore
        formData.append('media', { uri, name: filename, type });
      }

      await signalementService.create(formData);
      Alert.alert('SIGNALEMENT PUBLIÉ', 'Votre information a été transmise aux unités de zone.');
      setShowSheet(false);
    } catch (error: any) {
      console.error('Report submission failed:', error);
      Alert.alert('ÉCHEC', 'Le système n\'a pas pu transmettre votre signalement.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={uberBlackMapStyle}
        initialRegion={region}
        showsUserLocation={false}
      >
        {/* User Current Position Pulse */}
        <Marker coordinate={{ 
          latitude: userLocation?.coords.latitude || region.latitude, 
          longitude: userLocation?.coords.longitude || region.longitude 
        }}>
          <View style={styles.userMarkerContainer}>
            <Animated.View 
              style={[
                styles.pulseCircle, 
                { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({
                  inputRange: [1, 2.2],
                  outputRange: [0.6, 0]
                }) }
              ]} 
            />
            <View style={styles.userDot} />
          </View>
        </Marker>

        {/* Mock Agent Markers */}
        {MOCK_AGENTS.map((agent) => (
          <Marker 
            key={agent.id} 
            coordinate={{ latitude: agent.lat, longitude: agent.lng }}
          >
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={styles.agentMarker}
            >
              <Siren size={16} color="#71d24d" />
            </MotiView>
          </Marker>
        ))}
      </MapView>

      {/* Floating Tactical Overlay */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.intelBadge}>
            <Text style={styles.intelText}>ZONE PLATEAU : SÉCURISÉE</Text>
          </View>
        </View>

        <View style={styles.sideControls}>
          <TouchableOpacity style={styles.sideBtn}><Layers color="#fff" size={20} /></TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={moveToUserLocation}>
            <LocateFixed color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={handleManualAdd}
          >
            <Plus color="#000" size={32} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sosBtn}
            onPress={handleSOS}
          >
            <ShieldAlert color="#fff" size={32} />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <AnimatePresence>
        {showSheet && (
          <ReportBottomSheet 
            onClose={() => setShowSheet(false)} 
            onSubmit={handleReportSubmit} 
          />
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { ...StyleSheet.absoluteFillObject },
  userMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  pulseCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  agentMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 2,
    borderColor: '#71d24d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#71d24d',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'space-between',
  },
  topBar: { alignItems: 'center' },
  intelBadge: {
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(113, 210, 77, 0.3)',
  },
  intelText: { color: '#71d24d', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sideControls: { position: 'absolute', right: 20, top: 100, gap: 12 },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#71d24d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#71d24d',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sosBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sosText: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 2 },
});
