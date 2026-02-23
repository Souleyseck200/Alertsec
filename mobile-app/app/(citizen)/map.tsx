import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Pressable,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { 
  Search, 
  Layers, 
  Navigation, 
  Filter, 
  Shield, 
  LocateFixed,
  AlertOctagon,
  X,
  Compass,
  ShieldCheck,
  Phone
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// INTERNAL UI KIT IMPORTS
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const { width } = Dimensions.get('window');

const HAZARDS = [
  { id: 'h1', type: 'robbery', label: 'Suspicion Vol', x: 200, y: 350, severity: 'high' },
  { id: 'h2', type: 'crowd', label: 'Manifestation', x: 50, y: 500, severity: 'moderate' },
  { id: 'h3', type: 'fire', label: 'Incident Incendie', x: 300, y: 220, severity: 'critical' },
];

const SAFE_ZONES = [
  { id: 's1', type: 'police', label: 'Poste Central', x: 150, y: 450 },
  { id: 's2', type: 'medical', label: 'Clinique Pasteur', x: 80, y: 280 },
  { id: 's3', type: 'refuge', label: 'Abris AlertSec', x: 280, y: 600 },
];

export default function TacticalMapScreen() {
  const [activePoint, setActivePoint] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState('Safety');

  const handlePointSelect = (point: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivePoint(point);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* TACTICAL MAP ENGINE MOCK */}
      <View style={styles.mapContainer}>
         <View style={styles.baseMap}>
            <LinearGradient colors={['#09090b', '#18181b']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.gridOverlay}>
               {[...Array(20)].map((_, i) => (
                  <View key={i} style={[styles.gridLine, { top: i * 50 }]} />
               ))}
            </View>

            {/* HAZARD RENDERER */}
            {HAZARDS.map((hz) => (
               <MotiView key={hz.id} style={[styles.pointWrapper, { top: hz.y, left: hz.x }]}>
                  <MotiView
                     from={{ scale: 1, opacity: 0.8 }}
                     animate={{ scale: 3, opacity: 0 }}
                     transition={{ loop: true, duration: 2500, type: 'timing' }}
                     style={[styles.hazardPulse, hz.severity === 'critical' && styles.criticalPulse]}
                  />
                  <Pressable onPress={() => handlePointSelect(hz)} style={styles.hazardIcon}>
                     <AlertOctagon color="#fff" size={14} />
                  </Pressable>
               </MotiView>
            ))}

            {/* SAFE ZONE RENDERER */}
            {SAFE_ZONES.map((sz) => (
               <View key={sz.id} style={[styles.pointWrapper, { top: sz.y, left: sz.x }]}>
                  <Pressable onPress={() => handlePointSelect(sz)} style={styles.safeIcon}>
                     <ShieldCheck color="#71d24d" size={16} />
                  </Pressable>
               </View>
            ))}
         </View>
      </View>

      {/* FLOATING UI OVERLAYS */}
      <SafeAreaView style={styles.overlayLayer}>
         <View style={styles.topControls}>
            <BlurView intensity={60} tint="dark" style={styles.searchBar}>
               <Search color="#a1a1aa" size={20} />
               <Text style={styles.searchPlaceholder}>Rechercher un refuge...</Text>
               <View style={styles.filterDisk}><Filter color="#fff" size={16} /></View>
            </BlurView>
            
            <View style={styles.layerTabs}>
               {['Safety', 'Traffic', 'Weather'].map((layer) => (
                  <Pressable 
                     key={layer}
                     onPress={() => setActiveLayer(layer)}
                     style={[styles.layerTab, activeLayer === layer && styles.layerTabActive]}
                  >
                     <Text style={[styles.layerTypeText, activeLayer === layer && styles.layerTypeTextActive]}>
                        {layer.toUpperCase()}
                     </Text>
                  </Pressable>
               ))}
            </View>
         </View>

         <View style={{ flex: 1 }} />

         {/* POINT SITUATION DRAWER */}
         <AnimatePresence>
            {activePoint && (
               <MotiView
                  from={{ translateY: 300, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  exit={{ translateY: 300, opacity: 0 }}
                  style={styles.drawerContainer}
               >
                  <Card variant="glass" blurIntensity={100}>
                     <CardHeader className="flex-row justify-between items-start">
                        <View>
                           <Badge 
                              variant={activePoint.severity ? 'emergency' : 'viva'} 
                              label={activePoint.severity ? 'DANGER SIGNALÉ' : 'REFUGE VÉRIFIÉ'} 
                              pulse={activePoint.severity === 'critical' ? 'intense' : 'none'}
                              dot
                           />
                           <CardTitle className="mt-2 text-2xl">{activePoint.label}</CardTitle>
                        </View>
                        <Pressable onPress={() => setActivePoint(null)} style={styles.closeBtn}>
                           <X color="#fff" size={20} />
                        </Pressable>
                     </CardHeader>
                     <CardContent>
                        <Text style={styles.pointInfo}>
                           Dernier signalement il y a 5 minutes. Zone surveillée par le poste de commandement Plateau. 
                           Distance : 850m. Temps estimé : 12 mins.
                        </Text>
                        <View style={styles.drawerActions}>
                           <Button variant="viva" label="Naviguer" leftIcon={Navigation} className="flex-1" />
                           <Button variant="tactical" size="icon" label="Fermer" leftIcon={Phone} className="ml-2" />
                        </View>
                     </CardContent>
                  </Card>
               </MotiView>
            )}
         </AnimatePresence>

         <View style={styles.fabStack}>
            <View style={styles.fabSecondaryStack}>
               <Pressable style={styles.fabSmall}><Layers color="#fff" size={20} /></Pressable>
               <Pressable style={styles.fabSmall}><Compass color="#fff" size={20} /></Pressable>
            </View>
            <Pressable style={styles.fabMain} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
               <LocateFixed color="#000" size={28} />
            </Pressable>
         </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  baseMap: { flex: 1, position: 'relative' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.05 },
  gridLine: { height: 0.5, width: '100%', backgroundColor: '#fff', position: 'absolute' },
  pointWrapper: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hazardPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.3)' },
  criticalPulse: { backgroundColor: 'rgba(239, 68, 68, 0.6)' },
  hazardIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  safeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(113, 210, 77, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#71d24d' },
  overlayLayer: { flex: 1 },
  topControls: { paddingHorizontal: 20, paddingTop: 20 },
  searchBar: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchPlaceholder: { color: '#a1a1aa', fontSize: 16, flex: 1 },
  filterDisk: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  layerTabs: { flexDirection: 'row', marginTop: 16, gap: 10 },
  layerTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  layerTabActive: { backgroundColor: '#71d24d' },
  layerTypeText: { color: '#a1a1aa', fontSize: 10, fontWeight: '900' },
  layerTypeTextActive: { color: '#000' },
  drawerContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  pointInfo: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  drawerActions: { flexDirection: 'row' },
  fabStack: { position: 'absolute', right: 20, bottom: 40, alignItems: 'center', gap: 16 },
  fabSecondaryStack: { gap: 10 },
  fabSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fabMain: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#71d24d', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
});
