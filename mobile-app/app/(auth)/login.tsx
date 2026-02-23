import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Fingerprint, 
  ArrowLeft,
  ChevronRight,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { Colors } from '../../constants/Theme';
import { MotiView, AnimatePresence } from 'moti';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ASSET_PATHS = {
  LOGO_WHITE: require('../../assets/Logo blanc.png'),
  LOGO_BLUE: require('../../assets/Logo bleu.png'),
};

const TacticalBracket = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const isTop = position.startsWith('t');
  const isLeft = position.endsWith('l');
  return (
    <View style={[
      styles.bracket,
      isTop ? { top: -2, borderTopWidth: 2 } : { bottom: -2, borderBottomWidth: 2 },
      isLeft ? { left: -2, borderLeftWidth: 2 } : { right: -2, borderRightWidth: 2 },
    ]} />
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] INITIALISATION...', '[NET] VÉRIFICATION RÉSEAU... OK']);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const { login, selectedRole } = useAuth();
  const router = useRouter();

  const isAgent = selectedRole === 'AGENT';
  
  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    addLog('AUTHENTIFICATION EN COURS...');
    
    try {
      const data = await authService.login({ email, password });
      addLog('ACCÈS ACCORDÉ. REDIRECTION...');
      await login(data.user, data.token);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Échec de la connexion';
      setError(errMsg);
      addLog(`[ERREUR] ${errMsg.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.gridOverlay} />
        <MotiView
          from={{ translateY: -height }}
          animate={{ translateY: height }}
          transition={{ loop: true, duration: 4000, type: 'timing' }}
          style={styles.scanLine}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.replace('/(auth)/onboarding')}
        >
          <ArrowLeft size={20} color="#71717a" />
        </TouchableOpacity>

        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.header}
        >
          <View style={styles.logoBadge}>
            <Image 
              source={isAgent ? ASSET_PATHS.LOGO_BLUE : ASSET_PATHS.LOGO_WHITE} 
              style={styles.logoMain} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.authTitle}>PORTAIL D'ACCÈS</Text>
          <Text style={styles.authSubtitle}>IDENTIFICATION REQUISE</Text>
          
          <View style={styles.statusIndicator}>
            <MotiView 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ loop: true, duration: 1000 }}
              style={styles.statusDot}
            />
            <Text style={styles.statusText}>{isAgent ? 'UNITÉ TACTIQUE L4' : 'VIGILANCE CITOYENNE L1'}</Text>
          </View>
        </MotiView>

        <View style={styles.form}>
          <MotiView from={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 400 }}>
            <View style={styles.inputLabelContainer}>
               <Text style={styles.inputLabel}>MATRICULE / EMAIL</Text>
            </View>
            <View style={[styles.inputWrapper, focusedField === 'email' && { borderColor: '#71d24d' }]}>
              <TacticalBracket position="tl" />
              <TacticalBracket position="tr" />
              <TacticalBracket position="bl" />
              <TacticalBracket position="br" />
              <BlurView intensity={20} tint="dark" style={styles.inputInner}>
                <Mail size={16} color={focusedField === 'email' ? '#71d24d' : '#52525b'} />
                <TextInput
                  style={styles.input}
                  placeholder="EX: AGENT_782 / NOM@EMAIL.COM"
                  placeholderTextColor="#27272a"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </BlurView>
            </View>
          </MotiView>

          <MotiView from={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 500 }}>
             <View style={styles.inputLabelContainer}>
               <Text style={styles.inputLabel}>MOT DE PASSE</Text>
               <TouchableOpacity><Text style={styles.forgotText}>OUBLIÉ ?</Text></TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, focusedField === 'password' && { borderColor: '#71d24d' }]}>
              <TacticalBracket position="tl" />
              <TacticalBracket position="tr" />
              <TacticalBracket position="bl" />
              <TacticalBracket position="br" />
              <BlurView intensity={20} tint="dark" style={styles.inputInner}>
                <Lock size={16} color={focusedField === 'password' ? '#71d24d' : '#52525b'} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#27272a"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </BlurView>
            </View>
          </MotiView>

          <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 600 }}>
            <TouchableOpacity 
              disabled={loading}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#71d24d', '#4ade80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>{isAgent ? 'ACTIVER LA MISSION' : 'AUTORISER L\'ACCÈS'}</Text>
                    <ChevronRight size={18} color="#000" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>

          <MotiView 
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 300 }}
            style={styles.terminalContainer}
          >
            <View style={styles.terminalHeader}>
              <Terminal size={12} color="#71d24d" />
              <Text style={styles.terminalHeaderText}>LOGS DE SÉCURITÉ</Text>
            </View>
            <View style={styles.terminalBody}>
              {logs.map((log, i) => (
                <Text key={i} style={styles.logLine}>{log}</Text>
              ))}
            </View>
          </MotiView>

          <MotiView 
            from={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 700 }}
            style={styles.extraActions}
          >
            <View style={styles.biometricColumn}>
              <TouchableOpacity style={styles.biometricBtn}>
                <View style={styles.biometricRing}>
                  <Fingerprint size={20} color="#71d24d" />
                </View>
                <Text style={styles.biometricText}>BIOMETRIC</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              {!isAgent ? (
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity style={styles.registerBtn}>
                    <Text style={styles.registerText}>CRÉER UN COMPTE</Text>
                  </TouchableOpacity>
                </Link>
              ) : (
                <TouchableOpacity style={styles.registerBtn}>
                  <Text style={styles.registerText}>AIDE AU MATRICULE</Text>
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    borderWidth: 0.5,
    borderColor: '#71d24d',
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  scanLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#71d24d',
    opacity: 0.2,
    shadowColor: '#71d24d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  scrollContent: { padding: 24, paddingTop: 100, paddingBottom: 50 },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBadge: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMain: { width: 70, height: 70 },
  authTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },
  authSubtitle: { color: '#52525b', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 4 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#71d24d' },
  statusText: { color: '#71d24d', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  terminalContainer: {
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    borderWidth: 1,
    borderColor: '#18181b',
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#09090b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#18181b',
  },
  terminalHeaderText: { color: '#3f3f46', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  terminalBody: { padding: 10, gap: 2 },
  logLine: { color: '#71d24d', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.6 },
  form: { gap: 24 },
  inputLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 4 },
  inputLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  forgotText: { color: '#52525b', fontSize: 9, fontWeight: '800' },
  inputWrapper: { position: 'relative', borderRadius: 4, borderWidth: 1, borderColor: '#18181b' },
  bracket: { position: 'absolute', width: 8, height: 8, borderColor: 'rgba(113, 210, 77, 0.3)' },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 4,
    gap: 12,
  },
  input: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  submitBtn: {
    height: 56,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  extraActions: { marginTop: 32 },
  biometricColumn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  biometricBtn: { alignItems: 'center', gap: 6 },
  biometricRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  biometricText: { color: '#3f3f46', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  separator: { width: 1, height: 20, backgroundColor: '#18181b' },
  registerBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  registerText: { color: '#71d24d', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
