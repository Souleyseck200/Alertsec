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
import { MotiView } from 'moti';
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  Users, 
  ChevronRight,
  Eye,
  Radio
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// INTERNAL UI KIT IMPORTS
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

const { width } = Dimensions.get('window');

export default function OnboardingAgentScreen() {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsScanning(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#0a1a0d', '#051405']} style={StyleSheet.absoluteFill} />

      {/* SCANNER VISUAL */}
      <View style={styles.scannerWrapper}>
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.scannerCircle}
        >
          <Target color="#71d24d" size={180} strokeWidth={0.5} opacity={0.2} />
          {isScanning && (
            <MotiView
              from={{ translateY: -100, opacity: 0 }}
              animate={{ translateY: 100, opacity: 0.8 }}
              transition={{ loop: true, duration: 2500, type: 'timing' }}
              style={styles.scannerLine}
            />
          )}
          <MotiView
            animate={{ rotate: '360deg' }}
            transition={{ loop: true, duration: 8000, type: 'timing' }}
            style={styles.scannerTicks}
          >
            <ShieldCheck color="#71d24d" size={40} />
          </MotiView>
        </MotiView>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentSection}>
          <MotiView
            from={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 1000, type: 'spring' }}
          >
            <Badge label="RÉSEAU D'AGENTS VIVA" variant="viva" pulse="subtle" dot icon={Users} className="mb-4" />
            <Text style={styles.title}>PROTECTION PROXIMITÉ</Text>
            <Text style={styles.description}>
              Bénéficiez d'une intervention rapide grâce à notre réseau d'agents de sécurité certifiés, 
              prêts à intervenir H24.
            </Text>

            <View style={styles.statsGrid}>
              <Card variant="glass" className="flex-1 mr-2 p-0">
                <CardContent className="p-4 items-center">
                  <Zap color="#71d24d" size={24} />
                  <Text style={styles.statValue}>-5 MIN</Text>
                  <Text style={styles.statLabel}>INTERVENTION</Text>
                </CardContent>
              </Card>
              <Card variant="glass" className="flex-1 ml-2 p-0">
                <CardContent className="p-4 items-center">
                  <Eye color="#71d24d" size={24} />
                  <Text style={styles.statValue}>100%</Text>
                  <Text style={styles.statLabel}>VÉRIFIÉ</Text>
                </CardContent>
              </Card>
            </View>

            <Button 
              onPress={() => router.push('/(citizen)')}
              label="DÉMARRER L'EXPÉRIENCE"
              variant="viva"
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
  scannerWrapper: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  scannerCircle: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(113, 210, 77, 0.05)', borderWidth: 1, borderColor: 'rgba(113, 210, 77, 0.2)', alignItems: 'center', justifyContent: 'center' },
  scannerLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#71d24d', shadowColor: '#71d24d', shadowOpacity: 0.8, shadowRadius: 10 },
  scannerTicks: { position: 'absolute' },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  contentSection: { flex: 1, justifyContent: 'flex-end', paddingBottom: 40 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  description: { color: '#a1a1aa', fontSize: 16, lineHeight: 24, fontWeight: '500', marginBottom: 24 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 8 },
  statLabel: { color: '#71717a', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
