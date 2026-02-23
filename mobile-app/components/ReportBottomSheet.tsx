import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Theme';

interface ReportBottomSheetProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function ReportBottomSheet({ onClose, onSubmit }: ReportBottomSheetProps) {
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  // state
  const [type, setType] = useState('AUTRE');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ type, description, images });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#ccc' }}
      backgroundStyle={{ backgroundColor: '#fff' }}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>SIGNALER UN INCIDENT</Text>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
            <X color="#000" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Text style={styles.label}>TYPE DE SIGNALEMENT</Text>
          <View style={styles.typeGrid}>
            {['ACCIDENT', 'INCENDIE', 'AGRESSION', 'VOL', 'AUTRE'].map((t) => (
              <TouchableOpacity 
                key={t} 
                onPress={() => setType(t)}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                disabled={submitting}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={styles.input}
            placeholder="Décrivez ce que vous voyez..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
          />

          <Text style={styles.label}>PHOTOS / PREUVES</Text>
          <View style={styles.imageRow}>
            <TouchableOpacity 
              style={styles.addPhotoBtn} 
              onPress={takePhoto}
              disabled={submitting}
            >
              <Camera color="#666" size={24} />
              <Text style={styles.addPhotoText}>Caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addPhotoBtn} 
              onPress={pickImage}
              disabled={submitting}
            >
              <ImageIcon color="#666" size={24} />
              <Text style={styles.addPhotoText}>Galerie</Text>
            </TouchableOpacity>
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.previewImage} />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send color="#fff" size={20} />
                <Text style={styles.submitText}>PUBLIER LE SIGNALEMENT</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  form: {
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  typeBtnActive: {
    backgroundColor: '#71d24d',
    borderColor: '#71d24d',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
  },
  typeBtnTextActive: {
    color: '#000',
  },
  input: {
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    padding: 16,
    color: '#000',
    fontSize: 14,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  submitBtn: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
