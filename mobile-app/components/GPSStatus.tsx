import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface GPSStatusProps {
  accuracy?: number;
}

export default function GPSStatus({ accuracy }: GPSStatusProps) {
  const getStatus = () => {
    if (!accuracy) return { label: 'Recherche GPS...', color: '#71717a' };
    if (accuracy < 10) return { label: 'SIGNAL GPS : EXCELLENT', color: '#10b981' };
    if (accuracy < 30) return { label: 'SIGNAL GPS : MOYEN', color: '#f59e0b' };
    return { label: 'SIGNAL GPS : FAIBLE', color: '#ef4444' };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: status.color }]} />
      <Text style={[styles.text, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
