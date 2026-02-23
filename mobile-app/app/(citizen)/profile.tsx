import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Shield, Edit2, Camera, Award, Activity, MapPin } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Colors } from '../../constants/Theme';

export default function UserProfile() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>MON PROFIL TACTIQUE</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* PROFILE CARD */}
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2664&auto=format&fit=crop' }} 
                  style={styles.avatar} 
                />
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Camera color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.name}>SOULEYMANE DIOP</Text>
            <Text style={styles.role}>CITOYEN VIGILANT // SENEGAL</Text>
            
            <TouchableOpacity style={styles.editProfileBtn}>
              <Edit2 color="#71d24d" size={14} />
              <Text style={styles.editProfileText}>MODIFIER PROFIL</Text>
            </TouchableOpacity>
          </MotiView>

          {/* STATS GRID */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Activity color="#71d24d" size={24} />
              <Text style={styles.statVal}>24</Text>
              <Text style={styles.statLabel}>ALERTES</Text>
            </View>
            <View style={styles.statItem}>
              <Award color="#f59e0b" size={24} />
              <Text style={styles.statVal}>850</Text>
              <Text style={styles.statLabel}>POINTS XP</Text>
            </View>
            <View style={styles.statItem}>
              <MapPin color="#3b82f6" size={24} />
              <Text style={styles.statVal}>12</Text>
              <Text style={styles.statLabel}>ZONES</Text>
            </View>
          </View>

          {/* SECURITY STATUS */}
          <View style={styles.securityBanner}>
            <Shield color="#71d24d" size={20} />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>IDENTITÉ VÉRIFIÉE</Text>
              <Text style={styles.securityDesc}>Accès prioritaire au réseau AlertSec activé.</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  settingsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, alignItems: 'center' },
  profileCard: { 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  avatarContainer: { marginBottom: 20 },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#71d24d',
    padding: 4,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  editAvatarBtn: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#000', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#71d24d'
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 5 },
  role: { color: '#71717a', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  editProfileBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(113, 210, 77, 0.1)'
  },
  editProfileText: { color: '#71d24d', fontSize: 12, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: 15, marginVertical: 30 },
  statItem: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900', marginVertical: 8 },
  statLabel: { color: '#71717a', fontSize: 9, fontWeight: '900' },
  securityBanner: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    backgroundColor: 'rgba(113, 210, 77, 0.05)', 
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(113, 210, 77, 0.2)'
  },
  securityText: { flex: 1 },
  securityTitle: { color: '#71d24d', fontSize: 13, fontWeight: '900' },
  securityDesc: { color: '#71717a', fontSize: 11, marginTop: 2 }
});
