import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const kuponData = [
  { id: '1', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 80, warna: '#FFA500' },
  { id: '2', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 50, warna: '#AB47BC' },
  { id: '3', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 30, warna: '#FFA500' },
  { id: '4', judul: 'Get A Coupon !!', deskripsi: '5 uploads your problem', progress: 20, warna: '#AB47BC' },
];

export default function KuponScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setNama(user.user_metadata?.nama || 'User');
          setFoto(user.user_metadata?.foto || null);
        }
      };
      fetchUser();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.headerTitle}>Halo, {nama}!</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
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
              <View style={styles.cardLeft}>
                <Text style={styles.cardJudul}>{item.judul}</Text>
                <Text style={styles.cardDeskripsi}>{item.deskripsi}</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${item.progress}%`,
                    backgroundColor: item.warna,
                  }]} />
                </View>
              </View>
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
    overflow: 'hidden',
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