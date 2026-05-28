import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [alamat, setAlamat] = useState('Mengambil lokasi...');
  const [koordinat, setKoordinat] = useState({
    latitude: -6.1944,
    longitude: 106.7669,
  });
  
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
      setFoto(user.user_metadata?.foto || null);
    }
  };

  const fetchLokasi = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setAlamat('Izin lokasi ditolak');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setKoordinat({ latitude, longitude });

    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode.length > 0) {
      const g = geocode[0];
      const alamatLengkap = `${g.street || ''} ${g.district || ''}, ${g.city || ''}, ${g.region || ''}`.trim();
      setAlamat(alamatLengkap);
    }
  };

  return (
    <View style={styles.container}>
      {/* Peta full screen */}
      <MapView
        style={styles.map}
        region={{
          latitude: koordinat.latitude,
          longitude: koordinat.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={koordinat} title="Lokasi Kamu" />
      </MapView>

      {/* Header overlay di atas map */}
      <View style={styles.header}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.halo}>Halo, {nama}!</Text>
          <View style={styles.lokasiRow}>
            <Ionicons name="location" size={12} color="#FFA500" />
            <Text style={styles.lokasi} numberOfLines={1}>{alamat}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={20} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <Text style={styles.bottomLabel}>Menemukan Masalah?</Text>
          <Text style={styles.bottomSub}>Laporkan kepada kami</Text>
        </View>
        <TouchableOpacity
          style={styles.btnLaporan}
          onPress={() => router.push('/buat-laporan')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnLaporanText}>Buat Laporan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Header overlay
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: 'rgba(21, 101, 192, 0.92)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerText: {
    flex: 1,
  },
  halo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 2,
  },
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lokasi: {
    color: '#E3F2FD',
    fontSize: 11,
    flex: 1,
  },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 12,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(21, 101, 192, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomContent: {
    flex: 1,
  },
  bottomLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomSub: {
    color: '#90CAF9',
    fontSize: 11,
    marginTop: 2,
  },
  btnLaporan: {
    backgroundColor: '#FFA500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 3,
  },
  btnLaporanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});