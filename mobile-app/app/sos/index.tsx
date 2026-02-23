import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Pressable,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { 
  ShieldAlert, 
  MapPin, 
  Phone, 
  X, 
  Mic, 
  Camera,
  MessageCircle,
  Activity,
  UserCheck,
  Shield,
  Zap,
  Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// INTERNAL UI KIT IMPORTS
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const { width, height } = Dimensions.get('window');

export default function SOSEmergencyScreen() {
  const [countdown, setCountdown] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !isActive && !isCanceled) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isActive && !isCanceled) {
      setIsActive(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [countdown, isActive, isCanceled]);

  const handleCancel = () => {
    setIsCanceled(true);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', isActive ? '#450a0a' : '#1a0d0d']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER INDICATOR */}
        <View style={styles.header}>
          <Badge 
            label={isActive ? "INTÉRVENTION EN COURS" : "DÉCLENCHEMENT SOS"} 
            variant="emergency" 
            pulse="emergency" 
            dot 
          />
        </View>

        <View style={styles.mainVisual}>
          <AnimatePresence>
            {!isActive ? (
              <MotiView
                key="countdown"
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                style={styles.countdownContainer}
              >
                <MotiView
                  from={{ scale: 1 }}
                  animate={{ scale: 1.2 }}
                  transition={{ loop: true, duration: 1000, type: 'timing' }}
                  style={styles.countdownPulse}
                />
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownSub}>SECONDÉS RESTANTÉS</Text>
              </MotiView>
            ) : (
              <MotiView
                key="active"
                from={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.activeContainer}
              >
                <View style={styles.pulsingIcon}>
                  <ShieldAlert color="#fff" size={80} />
                </View>
                <Text style={styles.activeTitle}>ALERTE TRANSMISÉ</Text>
                <Text style={styles.activeSubtitle}>Les secours sont en route vers votre position.</Text>
                
                {/* LIVE TRACKING MOCK */}
                <View style={styles.trackingMocks}>
                   <View style={styles.trackerRow}>
                      <UserCheck color="#71d24d" size={20} />
                      <Text style={styles.trackerText}>Agent Moussa identifié (800m)</Text>
                   </View>
                   <View style={styles.trackerRow}>
                      <Activity color="#0ea5e9" size={20} />
                      <Text style={styles.trackerText}>Audio/Vidéo transmis au HQ</Text>
                   </View>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        {/* INTERVENTION DASHBOARD */}
        <View style={styles.bottomHud}>
          <AnimatePresence>
            {isActive && (
              <MotiView
                from={{ translateY: 100, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                style={styles.interventionCard}
              >
                <BlurView intensity={80} tint="dark" style={styles.glassPlate}>
                  <View style={styles.actionGrid}>
                    <Pressable style={styles.actionBtn}><Mic color="#fff" size={24} /></Pressable>
                    <Pressable style={styles.actionBtn}><Camera color="#fff" size={24} /></Pressable>
                    <Pressable style={styles.actionBtn}><Phone color="#fff" size={24} /></Pressable>
                  </View>
                </BlurView>
              </MotiView>
            )}
          </AnimatePresence>

          <Button 
            onPress={handleCancel}
            label={isActive ? "ANNULER L'ALERTE" : "ANNULER MAINTENANT"}
            variant="ghost"
            className="mt-6"
            textClassName="text-white opacity-40"
          />
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', paddingTop: 20 },
  mainVisual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownContainer: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ef4444' },
  countdownPulse: { ...StyleSheet.absoluteFillObject, borderRadius: 100, backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  countdownText: { color: '#fff', fontSize: 80, fontWeight: '900' },
  countdownSub: { color: '#ef4444', fontSize: 10, fontWeight: '900', marginTop: -5, letterSpacing: 1 },
  activeContainer: { alignItems: 'center', width: '100%' },
  pulsingIcon: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 },
  activeTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 32 },
  activeSubtitle: { color: '#a1a1aa', fontSize: 16, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  trackingMocks: { marginTop: 40, width: '100%', gap: 16 },
  trackerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 20 },
  trackerText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  bottomHud: { paddingBottom: 40 },
  interventionCard: { width: '100%' },
  glassPlate: { padding: 20, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
});
