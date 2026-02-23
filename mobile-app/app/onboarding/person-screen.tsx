import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Pressable,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight,
  Heart,
  Volume2,
  UserCheck,
  Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// INTERNAL UI KIT IMPORTS
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function OnboardingPersonScreen() {
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSOS(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#1a0d0d', '#2d0a0a']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.visualSection}>
          <AnimatePresence>
            {showSOS && (
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={styles.sosContainer}
              >
                <MotiView
                  from={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ loop: true, duration: 1500, type: 'timing' }}
                  style={[styles.pulseCircle, { backgroundColor: '#ef4444' }]}
                />
                <Pressable onPress={handleSimulateSOS} style={styles.sosCircle}>
                  <ShieldAlert color="#fff" size={64} />
                  <MotiView
                    animate={{ rotate: '360deg' }}
                    transition={{ loop: true, duration: 4000, type: 'timing' }}
                    style={{ position: 'absolute' }}
                  >
                    <Activity color="rgba(255,255,255,0.2)" size={120} strokeWidth={1} />
                  </MotiView>
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        <View style={styles.contentSection}>
          <MotiView
            from={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 800, type: 'spring' }}
          >
            <Badge label="SIGNAL D'URGENCE" variant="emergency" pulse="emergency" dot icon={AlertTriangle} className="mb-4" />
            <Text style={styles.title}>ALERTE INSTANTANÉE</Text>
            <Text style={styles.description}>
              En cas de danger, déclenchez une alerte immédiate. Votre position et profil médical sont transmis aux secours.
            </Text>

            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}><Heart color="#ef4444" size={20} /></View>
                <Text style={styles.featureLabel}>MÉDICAL</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}><Volume2 color="#ef4444" size={20} /></View>
                <Text style={styles.featureLabel}>AUDIO LIVE</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}><UserCheck color="#ef4444" size={20} /></View>
                <Text style={styles.featureLabel}>VÉRIFICATION</Text>
              </View>
            </View>

            <Button 
              onPress={() => router.push('/onboarding/agent-screen')}
              label="J'AI COMPRIS"
              variant="emergency"
              size="xl"
              rightIcon={ChevronRight}
              className="mt-8 w-full"
              glow
            />
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  visualSection: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  sosContainer: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  pulseCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  sosCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 },
  contentSection: { flex: 1, justifyContent: 'flex-end', paddingBottom: 40 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  description: { color: '#a1a1aa', fontSize: 16, lineHeight: 24, fontWeight: '500', marginBottom: 24 },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-between' },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  featureLabel: { color: '#71717a', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
