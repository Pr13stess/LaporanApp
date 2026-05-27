import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function BuatLaporanScreen() {
  const router = useRouter();
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState('');
  const [foto, setFoto] = useState(null);
  const [nama, setNama] = useState('');
  const [fotoProfil, setFotoProfil] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setNama(user.user_metadata?.nama || 'User');
          setFotoProfil(user.user_metadata?.foto || null);
        }
      };
      fetchUser();
    }, [])
  );

  const pilihFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const kirimLaporan = async () => {
    if (!judul || !detail) {
      Alert.alert('Gagal', 'Semua field harus diisi!');
      return;
    }

    const { error } = await supabase.from('laporan').insert({
      judul,
      tanggal,
      deskripsi: detail,
      nama: nama,
      status: 'pending',
      foto: null,
    });

    if (error) {
      Alert.alert('Error', 'Gagal mengirim laporan: ' + error.message);
    } else {
      Alert.alert('Berhasil!', 'Laporan kamu berhasil dikirim!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {fotoProfil ? (
          <Image source={{ uri: fotoProfil }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.headerTitle}>Halo, {nama}!</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.formTitle}>Laporan Sekitar</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama Laporan"
          placeholderTextColor="#aaa"
          value={judul}
          onChangeText={setJudul}
        />

        {/* <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            placeholder="Tanggal"
            placeholderTextColor="#aaa"
            value={tanggal}
            onChangeText={setTanggal}
          />
          <Ionicons name="calendar-outline" size={22} color="#aaa" style={styles.calendarIcon} />
        </View> */}

        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Detail"
          placeholderTextColor="#aaa"
          value={detail}
          onChangeText={setDetail}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.fotoBox} onPress={pilihFoto}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.fotoPreview} />
          ) : (
            <View style={styles.fotoPlaceholderBox}>
              <Text style={styles.fotoPlaceholder}>Confirmation (might be letters or pictures)</Text>
              <Ionicons name="image-outline" size={24} color="#aaa" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnKirim} onPress={kirimLaporan}>
          <Text style={styles.btnKirimText}>Kirim</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1565C0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    minHeight: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  inputMultiline: {
    height: 110,
    textAlignVertical: 'top',
  },
  fotoBox: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    height: 110,
    marginBottom: 28,
    overflow: 'hidden',
  },
  fotoPlaceholderBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  fotoPlaceholder: {
    color: '#aaa',
    fontSize: 13,
    flex: 1,
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  btnKirim: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 36,
  },
  btnKirimText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});