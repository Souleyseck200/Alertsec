import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Wifi, Shield, User } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';

interface TacticalHUDProps {
  isMissionActive?: boolean;
}

export default function TacticalHUD({ isMissionActive }: TacticalHUDProps) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <View style={styles.left}>
            <View style={[styles.statusDot, { backgroundColor: isMissionActive ? Colors.accentRed : Colors.accentGreen, shadowColor: isMissionActive ? Colors.accentRed : Colors.accentGreen }]} />
            <Text style={[styles.statusText, isMissionActive && { color: Colors.accentRed }]}>
              {isMissionActive ? '🔴 MISSION EN COURS' : `EN SERVICE - SECTEUR ${user?.zoneId || 'ALPHA'}`}
            </Text>
          </View>

          <View style={styles.right}>
            <Wifi size={14} color={Colors.accentGreen} style={styles.icon} />
            <TouchableOpacity style={styles.profileBtn}>
              {user?.photoUrl ? (
                <Image source={{ uri: `http://172.20.10.4:3000${user.photoUrl}` }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  blur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentGreen,
    shadowColor: Colors.accentGreen,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    opacity: 0.8,
  },
  profileBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
