import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, ShieldAlert } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';

export default function MissionsList() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LISTE DES MISSIONS</Text>
        <ShieldAlert color={Colors.accentBlue} size={20} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <List size={48} color="rgba(255,255,255,0.05)" />
          <Text style={styles.emptyTxt}>AUCUNE MISSION DISPONIBLE HORS CARTE</Text>
          <Text style={styles.emptySub}>UTILISEZ LA CARTE TACTIQUE POUR LES ALERTES EN DIRECT</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 16, opacity: 0.5 },
  emptyTxt: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: '#71717a', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
