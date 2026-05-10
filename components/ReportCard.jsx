import { View, Text, StyleSheet } from 'react-native';

const statusColor = {
  pending: '#FFA500',
  proses: '#1565C0',
  selesai: '#2E7D32',
};

export default function ReportCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.nama}>{item.nama}</Text>
          <Text style={styles.tanggal}>{item.tanggal}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor[item.status] }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.judul}>{item.judul}</Text>
      <Text style={styles.deskripsi}>{item.deskripsi}</Text>
      <Text style={styles.alamat}>📍 {item.alamat}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#90CAF9',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  nama: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1565C0',
  },
  tanggal: {
    fontSize: 11,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  judul: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    color: '#222',
  },
  deskripsi: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
  alamat: {
    fontSize: 11,
    color: '#888',
  },
});