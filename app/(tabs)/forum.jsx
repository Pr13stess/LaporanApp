import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ForumScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('terbaru');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLaporan();
    }, [sortBy])
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFoto(user.user_metadata?.foto || null);
    }
  };

  const fetchLaporan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('laporan')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setLaporan(data);
    setLoading(false);
  };

  const handleUpvote = async (item) => {
    const { error } = await supabase
      .from('laporan')
      .update({ upvotes: (item.upvotes || 0) + 1 })
      .eq('id', item.id);
    if (!error) fetchLaporan();
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.forumTitle}>Forum</Text>
          <View style={styles.sortBox}>
            <Text style={styles.sortLabel}>Sort by :</Text>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortBy(sortBy === 'terbaru' ? 'terlama' : 'terbaru')}
            >
              <Text style={styles.sortBtnText}>{sortBy}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={laporan}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/detail-forum', params: { id: item.id } })}
              >
                {/* Header Card */}
                <View style={styles.cardHeader}>
                  {item.foto_profil ? (
                    <Image source={{ uri: item.foto_profil }} style={styles.cardAvatar} />
                  ) : (
                    <View style={styles.cardAvatar} />
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNama}>{item.nama}</Text>
                    <Text style={styles.cardTanggal}>{item.tanggal}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      item.status === 'pending' ? '#FFA500' :
                      item.status === 'proses' ? '#1565C0' : '#2E7D32'
                  }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                {/* Judul */}
                <Text style={styles.cardJudul}>{item.judul}</Text>

                {/* Lokasi */}
                {item.alamat ? (
                  <View style={styles.lokasiRow}>
                    <Ionicons name="location-outline" size={12} color="#888" />
                    <Text style={styles.cardAlamat} numberOfLines={1}>{item.alamat}</Text>
                  </View>
                ) : null}

                {/* Foto Laporan */}
                {item.foto ? (
                  <Image source={{ uri: item.foto }} style={styles.cardFoto} />
                ) : null}

                {/* Upvote */}
                <View style={styles.upvoteRow}>
                  <TouchableOpacity
                    style={styles.upvoteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUpvote(item);
                    }}
                  >
                    <Ionicons name="thumbs-up-outline" size={16} color="#1565C0" />
                    <Text style={styles.upvoteText}>{item.upvotes || 0} Upvote</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  forumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  sortBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    color: '#555',
  },
  sortBtn: {
    backgroundColor: '#FFA500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sortBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  cardInfo: {
    flex: 1,
  },
  cardNama: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1565C0',
  },
  cardTanggal: {
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
  cardJudul: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardAlamat: {
    fontSize: 11,
    color: '#888',
    flex: 1,
  },
  cardFoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  upvoteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upvoteText: {
    color: '#1565C0',
    fontWeight: 'bold',
    fontSize: 12,
  },
});