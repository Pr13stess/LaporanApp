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
      {/* Header */}
      <View style={styles.header}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.halo}>Halo, {nama}!</Text>
          <Text style={styles.pingLabel}>Ping Location:</Text>
          <Text style={styles.lokasi} numberOfLines={1}>📍 {alamat}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Peta */}
      <MapView
        style={styles.map}
        region={{
          latitude: koordinat.latitude,
          longitude: koordinat.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={koordinat}
          title="Lokasi Kamu"
        />
      </MapView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>Menemukan Masalah?</Text>
        <TouchableOpacity
          style={styles.btnLaporan}
          onPress={() => router.push('/buat-laporan')}
        >
          <Text style={styles.btnLaporanText}>Buat Laporan</Text>
        </TouchableOpacity>
      </View>
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
  headerText: {
    flex: 1,
  },
  halo: {
    color: '#FFA500',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pingLabel: {
    color: '#fff',
    fontSize: 11,
  },
  lokasi: {
    color: '#fff',
    fontSize: 11,
  },
  map: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bottomText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnLaporan: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnLaporanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});