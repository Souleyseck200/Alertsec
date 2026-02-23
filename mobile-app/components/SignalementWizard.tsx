import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Camera, AlertCircle, Shield, Move, Users } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { MotiView } from 'moti';

const INCIDENT_TYPES = [
  { id: 'ACCIDENT', label: 'Accident', icon: Move },
  { id: 'VOL', label: 'Vol', icon: Shield },
];

export default function SignalementWizard({ onClose, onSubmit }: any) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onSubmit({ type });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>NOUVEAU SIGNALEMENT - ÉTAPE {step}</Text>
      <ScrollView>
        {step === 1 && (
          <View style={styles.grid}>
            {INCIDENT_TYPES.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setType(item.id)} style={[styles.card, type === item.id && styles.active]}>
                <item.icon size={24} color="#fff" />
                <Text style={{color: '#fff'}}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 2 && <Text style={{color: '#fff'}}>Confirmation de l'envoi...</Text>}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={onClose}><Text style={{color: 'red'}}>ANNULER</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleNext}><Text style={{color: 'blue'}}>CONTINUER</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: '50%', backgroundColor: Colors.background, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  stepTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '45%', padding: 20, backgroundColor: Colors.card, borderRadius: 10, alignItems: 'center' },
  active: { borderColor: Colors.accentBlue, borderWidth: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }
});
