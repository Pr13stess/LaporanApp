import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BuatLaporanScreen() {
  const router = useRouter();
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [detail, setDetail] = useState('');
  const [foto, setFoto] = useState(null);

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

  const kirimLaporan = () => {
    if (!judul || !tanggal || !detail) {
      Alert.alert('Gagal', 'Semua field harus diisi!');
      return;
    }
    Alert.alert('Berhasil!', 'Laporan kamu berhasil dikirim!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>Halo, King!</Text>
        <TouchableOpacity style={styles.settingBtn}>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.formTitle}>Laporan Sekitar</Text>

        {/* Input Nama Laporan */}
        <TextInput
          style={styles.input}
          placeholder="Nama Laporan"
          placeholderTextColor="#aaa"
          value={judul}
          onChangeText={setJudul}
        />

        {/* Input Tanggal */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Tanggal"
            placeholderTextColor="#aaa"
            value={tanggal}
            onChangeText={setTanggal}
          />
          <Ionicons name="calendar-outline" size={22} color="#aaa" style={styles.calendarIcon} />
        </View>

        {/* Input Detail */}
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Detail"
          placeholderTextColor="#aaa"
          value={detail}
          onChangeText={setDetail}
          multiline
          numberOfLines={4}
        />

        {/* Upload Foto */}
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

        {/* Tombol Kirim */}
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
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  settingBtn: {
    marginLeft: 'auto',
  },
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#1565C0',
    borderRadius: 6,
    padding: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  fotoBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 120,
    marginBottom: 24,
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
    paddingHorizontal: 32,
  },
  btnKirimText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});