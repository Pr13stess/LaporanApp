import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, ScrollView, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl
} from 'react-native';
import { supabase } from '../../lib/supabase';

const SORT_OPTIONS = ['terbaru', 'terlama', 'populer', 'pending', 'selesai'];

export default function ForumScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('terbaru');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('laporan')
      .select('*, profiles(nama, foto_profil)')
      .throwOnError();

    if (sortBy === 'terbaru') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'terlama') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'populer') query = query.order('upvotes', { ascending: false });
    else if (sortBy === 'pending') query = query.eq('status', 'pending').order('created_at', { ascending: false });
    else if (sortBy === 'selesai') query = query.eq('status', 'selesai').order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("fetchLaporan error:", JSON.stringify(error));
      setLoading(false);
      return;
    }

    const laporanData = data ?? [];
    setLaporan(laporanData);

    if (user && laporanData.length > 0) {
      const { data: likesData } = await supabase
        .from('laporan_likes')
        .select('laporan_id')
        .eq('user_id', user.id);
      if (likesData) {
        setLikedIds(new Set(likesData.map(l => l.laporan_id)));
      }
    }

    setLoading(false);
  };

  const handleUpvote = async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isLiked = likedIds.has(item.id);
    const newIsLiked = !isLiked;

    // Optimistic update
    setLikedIds(prev => {
      const s = new Set(prev);
      newIsLiked ? s.add(item.id) : s.delete(item.id);
      return s;
    });
    setLaporan(prev =>
      prev.map(l => l.id === item.id
        ? { ...l, upvotes: (l.upvotes || 0) + (newIsLiked ? 1 : -1) }
        : l
      )
    );

    if (newIsLiked) {
      await supabase.from('laporan_likes').insert({ user_id: user.id, laporan_id: item.id });
      await supabase.rpc('increment_laporan_upvotes', { laporan_id: item.id });
    } else {
      await supabase.from('laporan_likes').delete()
        .eq('user_id', user.id).eq('laporan_id', item.id);
      await supabase.rpc('decrement_laporan_upvotes', { laporan_id: item.id });
    }
  };

  const filteredLaporan = laporan.filter(item =>
    item.judul?.toLowerCase().includes(search.toLowerCase()) ||
    item.alamat?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status) => {
    if (status === 'pending') return '#E53935';
    if (status === 'proses' || status === 'direview') return '#FFA500';
    if (status === 'selesai' || status === 'diterima') return '#2E7D32';
    return '#888';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color="#aaa" />
          </View>
        )}
        <Text style={styles.headerTitle}>Halo, {nama}!</Text>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
        >
          <Ionicons name="settings-sharp" size={18} color="#e49400" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari laporan"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Sort pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortScroll}
          contentContainerStyle={styles.sortContent}
        >
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.sortPill, sortBy === option && styles.sortPillActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.sortPillText, sortBy === option && styles.sortPillTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#FFA500" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredLaporan}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FFA500']}
                tintColor="#FFA500"
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/detail-forum', params: { id: item.id } })}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    {item.profiles?.foto_profil ? (
                      <Image source={{ uri: item.profiles.foto_profil }} style={styles.cardAvatar} />
                    ) : (
                      <View style={styles.cardAvatarPlaceholder}>
                        <Ionicons name="person" size={14} color="#aaa" />
                      </View>
                    )}
                    <View>
                      <Text style={styles.cardNama}>{item.profiles?.nama || 'User'}</Text>
                      <Text style={styles.cardTanggal}>{item.tanggal}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                {/* Lokasi */}
                {item.alamat ? (
                  <View style={styles.lokasiRow}>
                    <Ionicons name="location-outline" size={11} color="#888" />
                    <Text style={styles.cardAlamat} numberOfLines={1}>{item.alamat}</Text>
                  </View>
                ) : null}

                {/* Judul & Deskripsi */}
                <Text style={styles.cardJudul}>{item.judul}</Text>
                {item.deskripsi ? (
                  <Text style={styles.cardDeskripsi} numberOfLines={2}>{item.deskripsi}</Text>
                ) : null}

                {/* Foto */}
                {item.foto ? (
                  <Image source={{ uri: item.foto }} style={styles.cardFoto} />
                ) : null}

                {/* Footer */}
                <View style={styles.cardFooter}>

                  <View style={styles.footerRight}>
                    {/* Upvote */}
                    <TouchableOpacity
                      style={[styles.upvoteBtn, likedIds.has(item.id) && styles.upvoteBtnActive]}
                      onPress={(e) => { e.stopPropagation(); handleUpvote(item); }}
                    >
                      <Ionicons name="arrow-up" size={15} color="#fff" />
                      <Text style={[styles.upvoteText, likedIds.has(item.id) && styles.upvoteTextActive]}>{item.upvotes || 0}</Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        Share.share({ message: `${item.judul}\n${item.alamat}` });
                      }}
                    >
                      <Ionicons name="share-social-outline" size={17} color="#888" />
                    </TouchableOpacity>
                  </View>
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
    backgroundColor: '#1a1a1a',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    gap: 10,
    backgroundColor: 'rgba(20,20,20,0.95)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    padding: 0,
  },

  // Sort
  sortScroll: {
    marginBottom: 14,
    flexGrow: 0,
  },
  sortContent: {
    gap: 8,
    paddingRight: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortPill: {
    paddingHorizontal: 18,
    minHeight: 36,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortPillActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  sortPillText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    lineHeight: 16,
    includeFontPadding: false,
  },
  sortPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  cardAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNama: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#e49400',
  },
  cardTanggal: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  cardAlamat: {
    fontSize: 11,
    color: '#888',
    flex: 1,
  },
  cardJudul: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
    marginBottom: 4,
  },
  cardDeskripsi: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFoto: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    marginBottom: 10,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upvoteBtnActive: {
    backgroundColor: '#FFA500',
  },
  upvoteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  upvoteTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  shareBtn: {
    padding: 4,
  },
});
