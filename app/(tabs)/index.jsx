import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.halo}>Halo, King!</Text>
          <Text style={styles.pingLabel}>Ping Location:</Text>
          <Text style={styles.lokasi}>📍 Jl. Raya Kebon Jeruk No. 37, Jakarta Barat</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Peta */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -6.1944,
          longitude: 106.7669,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: -6.1944, longitude: 106.7669 }}
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
    fontSize: 14,
  },
});