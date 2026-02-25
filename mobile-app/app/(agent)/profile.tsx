import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Shield, Edit2, Camera, Award, Activity, MapPin, LogOut } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Colors } from '../../constants/Theme';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const API_URL = Platform.OS === 'android' ? 'http://172.20.10.4:3000' : 'http://localhost:3000';

export default function AgentProfile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setProfile(res.data);
    } catch (e) {
      console.log('Error fetching agent profile', e);
      setProfile(user);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'AlertSec a besoin d\'accéder à vos photos pour modifier votre profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0]);
    }
  };

  const uploadProfilePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.patch('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        setProfile(res.data);
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès.');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=2667&auto=format&fit=crop';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>ACCRÉDITATION TACTIQUE</Text>
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
                  source={{ uri: getImageUrl(profile?.photoUrl) }} 
                  style={styles.avatar} 
                />
                <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage} disabled={loading}>
                  <Camera color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.name}>{profile?.nom?.toUpperCase()} {profile?.prenom?.toUpperCase()}</Text>
            <Text style={styles.role}>
              {profile?.grade ? `${profile.grade} // ` : ''}
              MÉDAILLON #{profile?.id} // 
              ACTIF
            </Text>
            
            <TouchableOpacity style={styles.editProfileBtn}>
              <Edit2 color={Colors.accentBlue} size={14} />
              <Text style={styles.editProfileText}>MODIFIER DOSSIER</Text>
            </TouchableOpacity>
          </MotiView>

          {/* STATS GRID */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Activity color={Colors.accentBlue} size={24} />
              <Text style={styles.statVal}>{profile?.tauxReussite || 100}%</Text>
              <Text style={styles.statLabel}>RÉSOLUTION</Text>
            </View>
            <View style={styles.statItem}>
              <Award color="#f59e0b" size={24} />
              <Text style={styles.statVal}>{profile?.points || 0}</Text>
              <Text style={styles.statLabel}>XP OPÉRAS</Text>
            </View>
            <View style={styles.statItem}>
              <MapPin color={Colors.accentOrange} size={24} />
              <Text style={styles.statVal}>ZONE {profile?.zoneId || 'X'}</Text>
              <Text style={styles.statLabel}>AFFECTATION</Text>
            </View>
          </View>

          {/* SECURITY STATUS */}
          <View style={styles.securityBanner}>
            <Shield color={Colors.accentBlue} size={20} />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>HABILITATION CONFIRMÉE</Text>
              <Text style={styles.securityDesc}>Accès autorisé aux canaux de commandement AlertSec.</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={logout}
          >
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.logoutText}>DÉCONNEXION DE SESSION</Text>
          </TouchableOpacity>

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
    borderColor: Colors.accentBlue,
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
    borderColor: Colors.accentBlue
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
    backgroundColor: 'rgba(37, 99, 235, 0.1)'
  },
  editProfileText: { color: Colors.accentBlue, fontSize: 12, fontWeight: '900' },
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
    backgroundColor: 'rgba(37, 99, 235, 0.05)', 
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)'
  },
  securityText: { flex: 1 },
  securityTitle: { color: Colors.accentBlue, fontSize: 13, fontWeight: '900' },
  securityDesc: { color: '#71717a', fontSize: 11, marginTop: 2 },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 30,
    marginBottom: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
