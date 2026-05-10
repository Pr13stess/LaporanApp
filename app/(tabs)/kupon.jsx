import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const kuponData = [
  { id: '1', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 80, warna: '#FFA500' },
  { id: '2', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 50, warna: '#AB47BC' },
  { id: '3', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 30, warna: '#FFA500' },
  { id: '4', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 20, warna: '#AB47BC' },
];

export default function KuponScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>Halo, King!</Text>
        <TouchableOpacity>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Task</Text>

        <FlatList
          data={kuponData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Kiri */}
              <View style={styles.cardLeft}>
                <Text style={styles.cardJudul}>{item.judul}</Text>
                <Text style={styles.cardDeskripsi}>{item.deskripsi}</Text>

                {/* Progress Bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${item.progress}%`,
                    backgroundColor: item.warna,
                  }]} />
                </View>
              </View>

              {/* Kanan - Trophy */}
              <View style={[styles.trophyBox, { backgroundColor: item.warna }]}>
                <Ionicons name="trophy" size={36} color="#fff" />
              </View>
            </View>
          )}
        />
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
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
  },
  cardJudul: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  cardDeskripsi: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  trophyBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});