import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function BuatLaporanScreen() {
  const router = useRouter();
  const [judul, setJudul] = useState('');
  const [tanggal] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState('');
  const [foto, setFoto] = useState(null);
  const [nama, setNama] = useState('');
  const [fotoProfil, setFotoProfil] = useState(null);
  const [alamat, setAlamat] = useState('');
  const [loadingLokasi, setLoadingLokasi] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLokasi();
    }, [])
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFotoProfil(user.user_metadata?.foto || null);
    }
  };

  const fetchLokasi = async () => {
    setLoadingLokasi(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk mengisi alamat otomatis.');
      setLoadingLokasi(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (geocode.length > 0) {
      const g = geocode[0];
      const alamatLengkap = `${g.street || ''} ${g.district || ''}, ${g.city || ''}, ${g.region || ''}, ${g.country || ''}`.trim();
      setAlamat(alamatLengkap);
    }
    setLoadingLokasi(false);
  };

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

    let fotoUrl = null;

    if (foto) {
      const ext = foto.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', {
        uri: foto,
        name: fileName,
        type: `image/${ext}`,
      });

      const { error: uploadError } = await supabase.storage
        .from('laporan-foto')
        .upload(fileName, formData);

      if (uploadError) {
        Alert.alert('Error', 'Gagal upload foto: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('laporan-foto')
        .getPublicUrl(fileName);

      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('laporan').insert({
      judul,
      tanggal,
      deskripsi: detail,
      nama,
      status: 'pending',
      foto: fotoUrl,
      foto_profil: fotoProfil,
      alamat,
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
        <TouchableOpacity onPress={() => router.replace('/(tabs)/forum')}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
        {fotoProfil ? (
          <Image source={{ uri: fotoProfil }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
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

        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Detail"
          placeholderTextColor="#aaa"
          value={detail}
          onChangeText={setDetail}
          multiline
          numberOfLines={4}
        />

        {/* Lokasi */}
        <View style={styles.lokasiBox}>
          <Ionicons name="location-outline" size={18} color="#1565C0" />
          <Text style={styles.lokasiText} numberOfLines={2}>
            {loadingLokasi ? 'Mengambil lokasi...' : alamat || 'Lokasi tidak ditemukan'}
          </Text>
          <TouchableOpacity onPress={fetchLokasi}>
            <Ionicons name="refresh-outline" size={18} color="#1565C0" />
          </TouchableOpacity>
        </View>

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

        <TouchableOpacity style={styles.btnKirim} onPress={kirimLaporan}>
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.btnKirimText}>Kirim Laporan</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  headerTitle: {
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
  inputMultiline: {
    height: 110,
    textAlignVertical: 'top',
  },
  lokasiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    backgroundColor: '#F0F4FF',
  },
  lokasiText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
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
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnKirimText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
  borderWidth: 1.5,
  borderColor: '#ccc',
  borderRadius: 10,
  padding: 12,
  paddingLeft: 14,
  marginBottom: 14,
  fontSize: 14,
  color: '#333',
  backgroundColor: '#FAFAFA',
},
});