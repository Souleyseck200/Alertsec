import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, ChevronRight, Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Colors } from '../../constants/Theme';

const MOCK_SIGNALS = [
  { id: 1, type: 'ACCIDENT', status: 'EN COURS', date: 'Il y a 2h', desc: 'Collision entre deux véhicules avenue Cheikh Anta Diop.' },
  { id: 2, type: 'TRAVAUX', status: 'TRAITÉ', date: 'Hier', desc: 'Route barrée pour maintenance réseau.' },
  { id: 3, type: 'DANGER', status: 'TRAITÉ', date: 'Il y a 2 jours', desc: 'Fil électrique dénudé près du marché.' },
];

export default function SignalHistory() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>MES SIGNALEMENTS</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Plus color="#71d24d" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {MOCK_SIGNALS.map((signal, i) => (
            <MotiView
              key={signal.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100 }}
            >
              <Card variant="glass" className="mb-4">
                <CardHeader className="flex-row justify-between items-center">
                  <View>
                    <Badge 
                      label={signal.type} 
                      variant={signal.type === 'ACCIDENT' ? 'emergency' : 'warning'} 
                      size="xs" 
                    />
                    <CardTitle className="text-xl mt-2">{signal.type}</CardTitle>
                  </View>
                  <Badge 
                    label={signal.status} 
                    variant={signal.status === 'EN COURS' ? 'viva' : 'info'} 
                    size="xs" 
                  />
                </CardHeader>
                <CardContent>
                  <Text style={styles.desc}>{signal.desc}</Text>
                  <View style={styles.footer}>
                    <Clock size={12} color="#71717a" />
                    <Text style={styles.date}>{signal.date}</Text>
                    <TouchableOpacity style={styles.detailsBtn}>
                      <Text style={styles.detailsText}>DÉTAILS</Text>
                      <ChevronRight size={14} color="#71d24d" />
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            </MotiView>
          ))}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(113, 210, 77, 0.1)', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  desc: { color: '#a1a1aa', fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 5 },
  date: { color: '#71717a', fontSize: 12, flex: 1 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailsText: { color: '#71d24d', fontSize: 12, fontWeight: '900' }
});
