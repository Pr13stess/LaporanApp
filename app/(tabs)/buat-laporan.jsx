import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
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
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    success: true,
  });

  const toastAnim = useRef(new Animated.Value(-80)).current;

  const showToast = (message, success = true) => {
    setToast({ visible: true, message, success });

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() =>
      setToast(prev => ({ ...prev, visible: false }))
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLokasi();
    }, [])
  );

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setFotoProfil(user.user_metadata?.foto || null);
    }
  };

  const fetchLokasi = async () => {
    setLoadingLokasi(true);

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Izin Ditolak',
        'Izin lokasi diperlukan untuk mengisi alamat otomatis.'
      );
      setLoadingLokasi(false);
      return;
    }

    const location =
      await Location.getCurrentPositionAsync({});

    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (geocode.length > 0) {
      const g = geocode[0];

      const alamatLengkap =
        `${g.street || ''} ${g.district || ''}, ${g.city || ''}, ${g.region || ''}, ${g.country || ''}`.trim();

      setAlamat(alamatLengkap);
    }

    setLoadingLokasi(false);
  };

  const pilihFoto = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
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
      showToast('Semua field harus diisi!', false);
      return;
    }

    if (sending) return;

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast(
        'Sesi habis, silakan login ulang',
        false
      );
      setSending(false);
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

      const { error: uploadError } =
        await supabase.storage
          .from('laporan-foto')
          .upload(fileName, formData);

      if (uploadError) {
        showToast('Gagal upload foto', false);
        setSending(false);
        return;
      }

      const { data: urlData } =
        supabase.storage
          .from('laporan-foto')
          .getPublicUrl(fileName);

      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('laporan')
      .insert({
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
      showToast(
        'Laporan berhasil dikirim!',
        true
      );
      setTimeout(() => router.back(), 1500);
    }

    setSending(false);
  };

  return (
    <View style={styles.container}>
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            { transform: [{ translateY: toastAnim }] },
            toast.success
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <Ionicons
            name={
              toast.success
                ? 'checkmark-circle'
                : 'close-circle'
            }
            size={20}
            color="#fff"
          />
          <Text style={styles.toastText}>
            {toast.message}
          </Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
           onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#E8B54A"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Buat Laporan
        </Text>

        {fotoProfil ? (
          <Image
            source={{ uri: fotoProfil }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatar} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.formTitle}>
          Laporan Sekitar
        </Text>

        <Text style={styles.label}>
          Nama Laporan
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nama laporan"
          placeholderTextColor="#B5B5B5"
          value={judul}
          onChangeText={setJudul}
        />

        <Text style={styles.label}>
          Detail Laporan
        </Text>

        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Deskripsikan masalah yang ada..."
          placeholderTextColor="#B5B5B5"
          value={detail}
          onChangeText={setDetail}
          multiline
        />

        <Text style={styles.label}>Lokasi</Text>

        <TextInput
          style={styles.input}
          editable={false}
          value={
            loadingLokasi
              ? 'Mengambil lokasi...'
              : alamat
          }
        />

        <TouchableOpacity
          style={styles.fotoBox}
          onPress={pilihFoto}
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={styles.fotoPreview}
            />
          ) : (
            <View style={styles.fotoPlaceholderBox}>
              <Ionicons
                name="image-outline"
                size={28}
                color="#C5C5C5"
              />
              <Text style={styles.fotoPlaceholder}>
                Upload Foto
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnKirim,
            sending && { opacity: 0.6 },
          ]}
          onPress={kirimLaporan}
          disabled={sending}
        >
          <Text style={styles.btnKirimText}>
            {sending
              ? 'Mengirim...'
              : 'Buat Laporan'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Tips: Sertakan foto dan lokasi yang jelas
          agar laporan lebih cepat diproses.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1C',
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },

  form: {
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 120,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2B2B2B',
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#333',
  },

  inputMultiline: {
    height: 160,
    textAlignVertical: 'top',
  },

  fotoBox: {
    height: 100,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },

  fotoPlaceholderBox: {
    alignItems: 'center',
  },

  fotoPlaceholder: {
    marginTop: 6,
    color: '#B5B5B5',
  },

  fotoPreview: {
    width: '100%',
    height: '100%',
  },

  btnKirim: {
    backgroundColor: '#E8B54A',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnKirimText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },

  tipText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#9A9A9A',
    fontSize: 13,
    lineHeight: 20,
  },

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
    backgroundColor: '#D9A441',
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
