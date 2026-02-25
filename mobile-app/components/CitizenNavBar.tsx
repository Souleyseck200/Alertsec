import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Shield, Camera, User } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

export default function CitizenNavBar() {
  const pathname = usePathname();

  const tabs = [
    { id: 'sos', icon: Shield, label: 'SOS', path: '/(citizen)' },
    { id: 'report', icon: Camera, label: 'SIGNALER', path: '/(citizen)/history' }, // History/Signalements mixed? Or history acts as report?
    { id: 'profile', icon: User, label: 'PROFIL', path: '/(citizen)/profile' },
  ];

  const handlePress = (path: string) => {
    router.replace(path as any);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <TouchableOpacity 
                key={tab.id}
                style={styles.tab}
                onPress={() => handlePress(tab.path)}
              >
                <Icon 
                  color={active ? '#007AFF' : 'rgba(255,255,255,0.4)'} 
                  size={24} 
                  strokeWidth={active ? 2.5 : 2}
                />
                <Text style={[styles.label, active && styles.activeLabel]}>
                  {tab.label}
                </Text>
                {active && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: width * 0.9,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 80,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '900',
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  }
});
