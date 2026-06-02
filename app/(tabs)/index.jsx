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
      {/*Peta*/}
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

      {/*Header*/}
      <View style={styles.header}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color="#aaa" />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.halo}>Halo, {nama}!</Text>
          <View style={styles.lokasiRow}>
            <Ionicons name="location" size={11} color="#FFA500" />
            <Text style={styles.lokasiLabel}>Ping Location:</Text>
          </View>
          <Text style={styles.lokasi} numberOfLines={1}>{alamat}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={20} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Laporan Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => router.push('/buat-laporan')}
      >
        <View style={styles.fabPill}>
          <Text style={styles.fabText}>Buat laporan</Text>
        </View>
        <View style={styles.fabIcon}>
          <Ionicons name="add" size={26} color="#fff" />
        </View>
      </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 14,
    gap: 10,
    backgroundColor: 'rgba(20, 20, 20, 0.88)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  halo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 1,
  },
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  lokasiLabel: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: '600',
  },
  lokasi: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 1,
  },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 8,
    borderRadius: 12,
  },

  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    },
  fabText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 13,
  },
  fabIcon: {
    backgroundColor: '#1a1a1a',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  fabPill: {
  backgroundColor: '#fff',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  marginRight: -20, 
  paddingRight: 28,  
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  },
});
