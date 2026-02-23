import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '../constants/Theme';

const { width, height } = Dimensions.get('window');

interface DangerPulseProps {
  active: boolean;
}

export default function DangerPulse({ active }: DangerPulseProps) {
  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <MotiView
        from={{ opacity: 0.1, scale: 0.95 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 1500,
        }}
        style={styles.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 10,
    borderColor: Colors.accentRed,
  },
});
