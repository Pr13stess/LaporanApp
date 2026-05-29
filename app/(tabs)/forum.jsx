import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Share, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ForumScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('terbaru');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showSort, setShowSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLaporan();
    }, [sortBy])
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLaporan();
    setRefreshing(false);
  }, [sortBy]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFoto(user.user_metadata?.foto || null);
    }
  };

  const fetchLaporan = async () => {
    setLoading(true);
    let query = supabase.from('laporan').select('*');

    if (sortBy === 'terbaru') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'terlama') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'populer') {
      query = query.order('upvotes', { ascending: false });
    } else if (sortBy === 'pending') {
      query = query.eq('status', 'pending').order('created_at', { ascending: false });
    } else if (sortBy === 'selesai') {
      query = query.eq('status', 'selesai').order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (!error) setLaporan(data);
    setLoading(false);
  };

  const handleUpvote = async (item) => {
  const isLiked = likedIds.has(item.id);

    // Optimistic update
    setLikedIds(prev => {
      const s = new Set(prev);
      isLiked ? s.delete(item.id) : s.add(item.id);
      return s;
    });
    setLaporan(prev =>
      prev.map(l => l.id === item.id
        ? { ...l, upvotes: (l.upvotes || 0) + (isLiked ? -1 : 1) }
        : l
      )
    );

    const { error } = await supabase
      .from('laporan')
      .update({ upvotes: (item.upvotes || 0) + (isLiked ? -1 : 1) })
      .eq('id', item.id);

    // Rollback kalau gagal
    if (error) {
      setLikedIds(prev => {
        const s = new Set(prev);
        isLiked ? s.add(item.id) : s.delete(item.id);
        return s;
      });
      setLaporan(prev =>
        prev.map(l => l.id === item.id
          ? { ...l, upvotes: (l.upvotes || 0) + (isLiked ? 1 : -1) }
          : l
        )
      );
    }
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
              onPress={() => setShowSort(prev => !prev)}
            >
              <Text style={styles.sortBtnText}>{sortBy}</Text>
              <Ionicons name={showSort ? "chevron-up" : "chevron-down"} size={14} color="#fff" />
            </TouchableOpacity>

            {showSort && (
              <View style={styles.dropdown}>
                {['terbaru', 'terlama', 'populer', 'pending', 'selesai'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dropdownItem, sortBy === option && styles.dropdownItemActive]}
                    onPress={() => {
                      setSortBy(option);
                      setShowSort(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, sortBy === option && styles.dropdownTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
              refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1565C0']}       
                tintColor="#1565C0"          
              />
            }
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
                      item.status === 'pending' ? '#D32F2F' :
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

                {/* Upvote & Share */}
                <View style={styles.upvoteRow}>
                  <TouchableOpacity
                    style={[styles.upvoteBtn, likedIds.has(item.id) && styles.upvoteBtnActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUpvote(item);
                    }}
                  >
                    <Ionicons
                      name={likedIds.has(item.id) ? "thumbs-up" : "thumbs-up-outline"}
                      size={18}
                      color={likedIds.has(item.id) ? "#1565C0" : "#555"}
                    />
                    <Text style={[styles.upvoteText, likedIds.has(item.id) && styles.upvoteTextActive]}>
                      {item.upvotes || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Share.share({ message: `${item.judul}\n${item.alamat}` });
                    }}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#555" />
                    
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
  zIndex: 999,
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
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  // upvoteDot: {
  //   width: 10,
  //   height: 10,
  //   borderRadius: 5,
  //   backgroundColor: '#4CAF50',
  // },
  upvoteText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareBtnText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  upvoteBtnActive: {
  backgroundColor: '#E3F2FD',
  },
  upvoteTextActive: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  dropdown: {
  position: 'absolute',
  top: 32,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: 10,
  elevation: 6,
  zIndex: 999,
  minWidth: 120,
  overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
    textTransform: 'capitalize',
  },
  dropdownTextActive: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
});