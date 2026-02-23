import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { 
  Search, 
  Shield, 
  Navigation, 
  LocateFixed, 
  AlertOctagon, 
  ChevronRight,
  Globe
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// INTERNAL UI KIT IMPORTS
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const { width, height } = Dimensions.get('window');

const GRID_SIZE = 40;
const GRID_OPACITY = 0.08;

const MOCK_HAZARDS = [
  { id: 'h1', x: width * 0.2, y: height * 0.3 },
  { id: 'h2', x: width * 0.7, y: height * 0.45 },
  { id: 'h3', x: width * 0.4, y: height * 0.6 },
];

const MOCK_SAFE_ZONES = [
  { id: 's1', x: width * 0.45, y: height * 0.25 },
  { id: 's2', x: width * 0.15, y: height * 0.55 },
];

export default function OnboardingMapScreen() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* TACTICAL MAP BACKGROUND */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={['#09090b', '#18181b', '#000']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* GRID OVERLAY */}
        <View style={styles.gridLayer}>
          {[...Array(Math.ceil(height / GRID_SIZE))].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLineH, { top: i * GRID_SIZE }]} />
          ))}
          {[...Array(Math.ceil(width / GRID_SIZE))].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineV, { left: i * GRID_SIZE }]} />
          ))}
        </View>

        {/* ANIMATED HAZARD POINTS */}
        <AnimatePresence>
          {isLoaded && MOCK_HAZARDS.map((hz, idx) => (
            <MotiView
              key={hz.id}
              from={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1000 + (idx * 300), type: 'spring' }}
              style={[styles.hazardPoint, { left: hz.x, top: hz.y }]}
            >
              <MotiView
                from={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ loop: true, duration: 2000, type: 'timing' }}
                style={styles.hazardPulse}
              />
              <AlertOctagon color="#ef4444" size={14} />
            </MotiView>
          ))}
        </AnimatePresence>

        {/* ANIMATED SAFE ZONES */}
        <AnimatePresence>
          {isLoaded && MOCK_SAFE_ZONES.map((sz, idx) => (
            <MotiView
              key={sz.id}
              from={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1500 + (idx * 400), type: 'spring' }}
              style={[styles.safePoint, { left: sz.x, top: sz.y }]}
            >
              <Shield color="#71d24d" size={16} />
            </MotiView>
          ))}
        </AnimatePresence>
      </View>

      {/* HUD OVERLAY */}
      <SafeAreaView style={styles.overlayLayer}>
        <View style={styles.topHud}>
          <MotiView
            from={{ translateY: -50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 800, type: 'spring' }}
            style={styles.hudBadgeContainer}
          >
            <Badge label="SYSTÈME GPS ACTIF" variant="info" pulse="subtle" dot icon={Globe} />
          </MotiView>
        </View>

        <View style={{ flex: 1 }} />

        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 1200, type: 'spring' }}
          style={styles.contentSection}
        >
          <Card variant="glass" blurIntensity={80} className="w-full">
            <CardHeader>
              <View style={styles.iconCircle}>
                <Navigation color="#71d24d" size={32} />
              </View>
              <CardTitle className="text-3xl mt-4 font-black">CARTOGRAPHIE TACTIQUE</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.description}>
                Visualisez les zones à risque en temps réel et identifiez les refuges sûrs autour de vous. 
                Une protection intelligente pour vos déplacements.
              </Text>

              <Button 
                onPress={() => router.push('/onboarding/person-screen')}
                label="CONTINUER"
                variant="viva"
                size="xl"
                rightIcon={ChevronRight}
                className="mt-6 w-full"
                glow
              />
            </CardContent>
          </Card>
        </MotiView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  gridLayer: { ...StyleSheet.absoluteFillObject },
  gridLineH: { height: 1, width: '100%', backgroundColor: '#fff', opacity: GRID_OPACITY, position: 'absolute' },
  gridLineV: { width: 1, height: '100%', backgroundColor: '#fff', opacity: GRID_OPACITY, position: 'absolute' },
  hazardPoint: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' },
  hazardPulse: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.4)' },
  safePoint: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(113, 210, 77, 0.1)', borderWidth: 1, borderColor: '#71d24d', alignItems: 'center', justifyContent: 'center' },
  overlayLayer: { flex: 1, paddingHorizontal: 20 },
  topHud: { alignItems: 'center', paddingTop: 20 },
  hudBadgeContainer: { padding: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  contentSection: { paddingBottom: 40 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(113, 210, 77, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(113, 210, 77, 0.2)' },
  description: { color: '#a1a1aa', fontSize: 16, lineHeight: 24, fontWeight: '500' },
});
