import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay,
  withTiming 
} from 'react-native-reanimated';
import { Siren, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface MissionToastProps {
  alert: any;
  onPress: () => void;
  onDetails: () => void;
  onHide: () => void;
}

export default function MissionToast({ alert, onPress, onDetails, onHide }: MissionToastProps) {
  const translateY = useSharedValue(-150);

  useEffect(() => {
    if (alert) {
      translateY.value = withSpring(0, { damping: 15 });
      
      const timer = setTimeout(() => {
        translateY.value = withTiming(-200, { duration: 500 }, () => {
          onHide();
        });
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!alert) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.toast}>
        <View style={styles.mainRow}>
          <View style={styles.iconContainer}>
            <Siren color="#fff" size={24} />
          </View>
          
          <View style={styles.content}>
            <Text style={styles.type}>{alert.type || 'ALERTE SOS'}</Text>
            <Text style={styles.subtitle}>NOM: {alert.citoyen?.nom || 'ANONYME'} // DISTANCE: 0.8 KM</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.detailsBtn} 
            onPress={onDetails}
          >
            <Text style={styles.detailsText}>DÉTAILS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.acceptBtn} 
            onPress={onPress}
          >
            <Text style={styles.acceptText}>⚡ PRENDRE EN CHARGE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  type: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  detailsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  acceptBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
