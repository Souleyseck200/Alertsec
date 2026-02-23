import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  ImageBackground, 
  StatusBar,
  Animated,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Shield, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  ArrowRight,
  Target,
  Globe,
  Lock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Activity
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ASSET_PATHS = {
  CITIZEN_MAP: require('../../assets/une image illustrant linterface de la carte avec ces points de danger.png'),
  CITIZEN_DANGER: require('../../assets/image dune persone en danger montran lapplication.png'),
  AGENT_ACTION: require('../../assets/une image montrant un agent en action.png'),
  LOGO_WHITE: require('../../assets/Logo blanc.png'),
  LOGO_BLUE: require('../../assets/Logo bleu.png'),
};

const SLIDES = [
  {
    id: 1,
    title: 'VIGILANCE TACTIQUE',
    description: 'Cartographie temps réel des zones de danger et patrouilles actives pour votre sécurité.',
    icon: Globe,
    asset: ASSET_PATHS.CITIZEN_MAP,
  },
  {
    id: 2,
    title: 'RÉPONSE SOS',
    description: 'Un protocole de détresse prioritaire relié instantanément au Centre de Commandement.',
    icon: ShieldAlert,
    asset: ASSET_PATHS.CITIZEN_DANGER,
  },
  {
    id: 3,
    title: 'UNITÉ D\'ÉLITE',
    description: 'Coordinations des forces en temps réel pour des interventions rapides et décisives.',
    icon: Target,
    asset: ASSET_PATHS.AGENT_ACTION,
  }
];

export default function Onboarding() {
  const router = useRouter();
  const { finishOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setIsFinishing(true);
    }
  }, [currentIndex]);

  const selectRole = async (role: 'CITIZEN' | 'AGENT') => {
    setLoadingRole(role);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await finishOnboarding(role);
    }, 800);
  };

  const renderSlide = ({ item, index }: any) => (
    <View style={styles.slideContainer}>
      <ImageBackground source={item.asset} style={styles.slideImage} resizeMode="cover">
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000']} style={styles.gradientOverlay} />
        <View style={styles.slideContent}>
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <View style={styles.iconCircle}>
              <Image source={ASSET_PATHS.LOGO_WHITE} style={styles.logoInCircle} resizeMode="contain" />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
          </MotiView>
        </View>
      </ImageBackground>
    </View>
  );

  if (isFinishing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Image 
          source={ASSET_PATHS.CITIZEN_MAP} 
          style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} 
          blurRadius={50}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', '#000']} style={StyleSheet.absoluteFill} />
        
        <SafeAreaView style={styles.roleContainer}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.roleHeader}
          >
            <View style={styles.logoBadge}>
              <Image source={ASSET_PATHS.LOGO_WHITE} style={styles.logoInBadge} resizeMode="contain" />
            </View>
            <Text style={styles.roleTitle}>MISSION SELECTION</Text>
            <Text style={styles.roleSubtitle}>DÉTERMINEZ VOTRE NIVEAU D'ENGAGEMENT</Text>
          </MotiView>

          <View style={styles.roleList}>
            {[
              { 
                id: 'CITIZEN', 
                name: 'ACCÈS CITOYEN', 
                icon: Shield, 
                clearance: 'ACCRÉDITATION L1',
                color: '#71d24d',
                desc: 'Unité de vigilance civile. Signalez les incidents et recevez des alertes en temps réel.',
              },
              { 
                id: 'AGENT', 
                name: 'UNITÉ TACTIQUE', 
                icon: ShieldAlert, 
                clearance: 'ACCRÉDITATION L4',
                color: '#71d24d',
                desc: 'Force d\'intervention. Coordonnez les opérations et gérez les déploiements critiques.',
              }
            ].map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => selectRole(role.id as any)}
                activeOpacity={0.9}
                style={[
                  styles.roleCardCombined,
                  loadingRole === role.id && { borderColor: '#71d24d' }
                ]}
              >
                <View style={styles.roleCardBody}>
                  <View style={styles.roleCardIdentity}>
                    <View style={styles.roleIconBoxPro}>
                      <Image 
                        source={role.id === 'AGENT' ? ASSET_PATHS.LOGO_BLUE : ASSET_PATHS.LOGO_WHITE} 
                        style={styles.roleLogoSmall} 
                        resizeMode="contain" 
                      />
                    </View>
                    <View>
                      <Text style={styles.roleNamePro}>{role.name}</Text>
                      <Text style={styles.roleClearancePro}>{role.clearance}</Text>
                    </View>
                  </View>
                  <Text style={styles.roleDescPro}>{role.desc}</Text>
                </View>

                <View style={styles.roleCardAction}>
                   {loadingRole === role.id ? (
                    <ActivityIndicator size="small" color="#71d24d" />
                  ) : (
                    <ChevronRight size={18} color="#71d24d" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.roleSecurityNote}>
            <Lock size={12} color="#71717a" />
            <Text style={styles.roleSecurityText}>PROTOCOLE DE SÉCURITÉ ENCRYPTÉ v4.0.1</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{currentIndex === SLIDES.length - 1 ? 'COMMENCER' : 'SUIVANT'}</Text>
          <ArrowRight color="#000" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Minimal helper to replace expo-linear-gradient for cleaner logic if needed
// const LinearGradient = ({ colors, style }: any) => (
//   <View style={[style, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
// );

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slideContainer: { width, height },
  slideImage: { flex: 1, justifyContent: 'flex-end' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  slideContent: { padding: 40, paddingBottom: 150 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(113, 210, 77, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(113, 210, 77, 0.1)' },
  slideTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  slideDescription: { color: '#a1a1aa', fontSize: 16, lineHeight: 24 },
  footer: { position: 'absolute', bottom: 50, left: 0, right: 0, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagination: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  activeDot: { width: 24, backgroundColor: '#71d24d' },
  nextBtn: { backgroundColor: '#71d24d', paddingHorizontal: 24, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  roleContainer: { flex: 1, padding: 24 },
  roleHeader: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoBadge: { width: 70, height: 70, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 },
  roleTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  roleSubtitle: { color: '#71717a', fontSize: 11, fontWeight: '600', letterSpacing: 2, marginTop: 12, textAlign: 'center' },
  roleList: { gap: 20 },
  roleCardCombined: { backgroundColor: '#18181b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a', flexDirection: 'row', alignItems: 'center' },
  roleCardBody: { flex: 1 },
  roleCardIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  roleIconBoxPro: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  roleNamePro: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  roleLogoSmall: { width: 50, height: 50 },
  logoInCircle: { width: 76, height: 76 },
  logoInBadge: { width: 76, height: 76 },
  roleClearancePro: { color: '#71d24d', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  roleDescPro: { color: '#a1a1aa', fontSize: 13, lineHeight: 18, paddingRight: 20 },
  roleCardAction: { width: 40, alignItems: 'flex-end' },
  roleSecurityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'auto', paddingBottom: 30 },
  roleSecurityText: { color: '#3f3f46', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});
