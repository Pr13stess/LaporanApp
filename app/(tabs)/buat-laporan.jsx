import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function BuatLaporanScreen() {
  const router = useRouter();

  const [judul, setJudul] = useState('');
  const [tanggal] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoProfil, setFotoProfil] = useState(null);
  const [alamat, setAlamat] = useState('');
  const [loadingLokasi, setLoadingLokasi] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', success: true });

  const toastAnim = useRef(new Animated.Value(-80)).current;

  const showToast = (message, success = true) => {
    setToast({ visible: true, message, success });
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, speed: 20 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast((prev) => ({ ...prev, visible: false })));
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLokasi();
    }, [])
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setFotoProfil(user.user_metadata?.foto || null);
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
      setAlamat(`${g.street || ''} ${g.district || ''}, ${g.city || ''}, ${g.region || ''}, ${g.country || ''}`.trim());
    }
    setLoadingLokasi(false);
  };

  const pilihFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const kirimLaporan = async () => {
    if (!judul || !detail) {
      showToast('Semua field harus diisi!', false);
      return;
    }
    if (sending) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Sesi habis, silakan login ulang', false);
      setSending(false);
      return;
    }

    let fotoUrl = null;
    if (foto) {
      const ext = foto.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: foto, name: fileName, type: `image/${ext}` });

      const { error: uploadError } = await supabase.storage
        .from('laporan-foto')
        .upload(fileName, formData);

      if (uploadError) {
        showToast('Gagal upload foto', false);
        setSending(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('laporan-foto').getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('laporan').insert({
      judul,
      tanggal,
      deskripsi: detail,
      user_id: user.id,
      status: 'pending',
      foto: fotoUrl,
      alamat,
    });

    if (error) {
      showToast('Gagal mengirim laporan', false);
    } else {
      showToast('Laporan berhasil dikirim!', true);
      setTimeout(() => router.back(), 1500);
    }

    setSending(false);
  };

  return (
    <View style={styles.container}>
      {/* Toast */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            { transform: [{ translateY: toastAnim }] },
            toast.success ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Ionicons
            name={toast.success ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
        {fotoProfil ? (
          <Image source={{ uri: fotoProfil }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={16} color="#aaa" />
          </View>
        )}
      </View>

      {/* Form */}
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Judul */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Info Laporan</Text>

          <Text style={styles.label}>Nama Laporan</Text>
          <TextInput
            style={styles.input}
            placeholder="Judul singkat masalah"
            placeholderTextColor="#bbb"
            value={judul}
            onChangeText={setJudul}
          />

          <Text style={styles.label}>Detail Laporan</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Deskripsikan masalah yang ada..."
            placeholderTextColor="#bbb"
            value={detail}
            onChangeText={setDetail}
            multiline
          />
        </View>

        {/* Lokasi */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-sharp" size={14} color={ORANGE} />
            <Text style={styles.sectionTitle}>Lokasi</Text>
          </View>

          <View style={styles.lokasiRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              editable={false}
              value={loadingLokasi ? 'Mengambil lokasi...' : alamat}
              placeholderTextColor="#bbb"
              placeholder="Lokasi belum tersedia"
            />
            <TouchableOpacity
              style={styles.refreshLokasiBtn}
              onPress={fetchLokasi}
              disabled={loadingLokasi}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={loadingLokasi ? '#ccc' : ORANGE}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Foto */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Foto</Text>

          <TouchableOpacity
            style={styles.fotoBox}
            onPress={pilihFoto}
            activeOpacity={0.85}
          >
            {foto ? (
              <>
                <Image source={{ uri: foto }} style={styles.fotoPreview} />
                <View style={styles.fotoOverlay}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                  <Text style={styles.fotoOverlayText}>Ganti Foto</Text>
                </View>
              </>
            ) : (
              <View style={styles.fotoPlaceholderBox}>
                <View style={styles.fotoIconCircle}>
                  <Ionicons name="image-outline" size={26} color={ORANGE} />
                </View>
                <Text style={styles.fotoPlaceholderText}>Upload Foto</Text>
                <Text style={styles.fotoPlaceholderSub}>
                  Tap untuk memilih dari galeri
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btnKirim, sending && { opacity: 0.65 }]}
          onPress={kirimLaporan}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <Text style={styles.btnKirimText}>Mengirim...</Text>
          ) : (
            <View style={styles.btnInner}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.btnKirimText}>Kirim Laporan</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Tips: Sertakan foto dan lokasi yang jelas agar laporan lebih cepat diproses.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ORANGE = '#e49400';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.97)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form wrapper
  form: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    minHeight: '100%',
    paddingBottom: 80,
  },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: ORANGE,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    height: 140,
    textAlignVertical: 'top',
    marginBottom: 0,
  },

  // Lokasi
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshLokasiBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Foto
  fotoBox: {
    height: 130,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fotoPlaceholderBox: {
    alignItems: 'center',
    gap: 6,
  },
  fotoIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fotoPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  fotoPlaceholderSub: {
    fontSize: 12,
    color: '#bbb',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  fotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  fotoOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Button
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnKirim: {
    backgroundColor: ORANGE,
    height: 52,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  btnKirimText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  tipText: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    lineHeight: 18,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 6,
    zIndex: 999,
  },
  toastSuccess: {
    backgroundColor: ORANGE,
  },
  toastError: {
    backgroundColor: '#D32F2F',
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
