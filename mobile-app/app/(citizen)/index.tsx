import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar,
  Alert
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { signalementService } from '../../services/api';
import { Colors } from '../../constants/Theme';
import { uberBlackMapStyle } from '../../constants/MapStyle'; // Keeping for base, but we will make it felt "lighter" via overlays
import HoldSOSButton from '../../components/HoldSOSButton';
import GPSStatus from '../../components/GPSStatus';
import CitizenNavBar from '../../components/CitizenNavBar';

export default function CitizenHome() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation(loc);
      
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      // Fetch hotspots (Danger Halos)
      try {
        const res = await signalementService.getHeatmap();
        setHotspots(res.data || []);
      } catch (e) {
        console.error('Heatmap fetch failed', e);
      }
    })();

    // Subscribe to location updates
    const sub = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
      (loc) => setUserLocation(loc)
    );

    return () => {
      sub.then(s => s.remove());
    };
  }, []);

  const handleSOSActivation = async () => {
    if (!userLocation) {
      Alert.alert('ERREUR GPS', 'Impossible de localiser votre position pour le SOS.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', 'URGENCE');
      formData.append('description', 'APPEL SOS CITOYEN (Hold-to-Activate)');
      formData.append('latitude', userLocation.coords.latitude.toString());
      formData.append('longitude', userLocation.coords.longitude.toString());
      formData.append('gravite', 'VITAL');
      formData.append('type_entree', 'SOS_AUTO');

      const res = await signalementService.create(formData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('UNITÉS EN ROUTE', 'Votre signal SOS a été reçu. Restez calme, les secours convergent vers vous.');
    } catch (e: any) {
      console.error('🔴 [SOS_ERROR]', e.response?.data || e.message);
      Alert.alert('ÉCHEC ENVOI', 'Impossible de transmettre le SOS. Tentez d\'appeler le 17.');
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
        initialRegion={{
          latitude: 14.7167,
          longitude: -17.4677,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        userLocationPriority="high"
        userLocationUpdateInterval={5000}
        tintColor="#007AFF"
      >
        {/* Safe Zones / Hazard Halos ONLY */}
        {hotspots.map((h, i) => (
           <Circle 
             key={`risk-${i}`}
             center={{ latitude: h.latitude, longitude: h.longitude }}
             radius={400}
             fillColor="rgba(255, 59, 48, 0.15)"
             strokeColor="rgba(255, 59, 48, 0.3)"
             strokeWidth={1}
           />
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
        </View>

        <View style={styles.center}>
          {/* Transparent spacer to push SOS to lower half but still centered */}
        </View>

        <View style={styles.bottomArea}>
           <HoldSOSButton onActivate={handleSOSActivation} />
        </View>
      </SafeAreaView>

      <CitizenNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    marginTop: 20,
  },
  center: {
    flex: 1,
  },
  bottomArea: {
    marginBottom: 120, // Space for NavBar
  }
});
