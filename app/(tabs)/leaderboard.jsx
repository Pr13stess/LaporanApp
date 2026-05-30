import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const podiumColors = {
  1: '#1565C0',
  2: '#5B8DD9',
  3: '#7BA7D4',
};

const podiumHeights = { 1: 80, 2: 60, 3: 44 };

export default function LeaderboardScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchLeaderboard();
    }, [])
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFoto(user.user_metadata?.foto || null);
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('laporan')
      .select('upvotes, profiles(id, nama, foto_profil)');


        console.log('data:', JSON.stringify(data));
        console.log('error:', error);
    if (error || !data) { setLoading(false); return; }

    const map = {};
    data.forEach(({ upvotes, profiles }) => {
      if (!profiles?.id) return;
      const key = profiles.id;
      if (!map[key]) {
        map[key] = {
          id: profiles.id,
          nama: profiles.nama,
          foto_profil: profiles.foto_profil,
          totalUpvotes: 0,
        };
      }
      map[key].totalUpvotes += upvotes || 0;
    });

    const sorted = Object.values(map)
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      .slice(0, 50)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    setLeaderboard(sorted);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUser(), fetchLeaderboard()]);
    setRefreshing(false);
  }, []);

  const formatUpvotes = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const PodiumAvatar = ({ uri, size = 46, borderColor = '#fff' }) => (
    uri
      ? <Image source={{ uri }} style={[styles.podiumAvatar, { width: size, height: size, borderRadius: size / 2, borderColor }]} />
      : <View style={[styles.podiumAvatar, { width: size, height: size, borderRadius: size / 2, borderColor }]} />
  );

  const renderPodiumCol = (item, rankKey) => (
    <View style={styles.podiumCol}>
      {rankKey === 1 && (
        <Ionicons name="trophy" size={22} color="#FFA500" style={{ marginBottom: 4 }} />
      )}
      <PodiumAvatar
        uri={item?.foto_profil}
        size={rankKey === 1 ? 52 : 44}
        borderColor={rankKey === 1 ? '#FFA500' : '#fff'}
      />
      <Text style={styles.podiumNama} numberOfLines={1}>{item?.nama ?? '-'}</Text>
      <View style={styles.podiumVotes}>
        <Ionicons name="thumbs-up" size={10} color="#4A6FA5" />
        <Text style={styles.podiumVoteText}>{formatUpvotes(item?.totalUpvotes ?? 0)}</Text>
      </View>
      <View style={[styles.podiumBase, {
        backgroundColor: podiumColors[rankKey],
        height: podiumHeights[rankKey],
      }]}>
        <Text style={[styles.podiumRankNum, rankKey === 1 && { fontSize: 26 }]}>{rankKey}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {foto
          ? <Image source={{ uri: foto }} style={styles.avatar} />
          : <View style={styles.avatar} />
        }
        <Text style={styles.headerTitle}>Halo, {nama}!</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={24} color="#FFA500" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : (
          <>
            {top3.length === 3 && (
              <View style={styles.podiumWrap}>
                {renderPodiumCol(top3[1], 2)}
                {renderPodiumCol(top3[0], 1)}
                {renderPodiumCol(top3[2], 3)}
              </View>
            )}

            <FlatList
              data={rest}
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
                <View style={[styles.listItem, item.id === String(rest.length + 3) && { borderBottomWidth: 0 }]}>
                  <Text style={styles.listRank}>{item.rank}</Text>
                  {item.foto_profil
                    ? <Image source={{ uri: item.foto_profil }} style={styles.listAvatar} />
                    : <View style={styles.listAvatar} />
                  }
                  <Text style={styles.listNama} numberOfLines={1}>{item.nama}</Text>
                  <View style={styles.voteChip}>
                    <Ionicons name="thumbs-up" size={13} color="#1565C0" />
                    <Text style={styles.voteChipText}>{formatUpvotes(item.totalUpvotes)}</Text>
                  </View>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1565C0' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#90CAF9', overflow: 'hidden' },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '500', fontSize: 16 },
  body: {
    flex: 1, backgroundColor: '#F0F4FA',
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '500', color: '#1565C0', marginBottom: 18 },

  // Podium
  podiumWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 20 },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumAvatar: { backgroundColor: '#90CAF9', marginBottom: 6, borderWidth: 2.5, overflow: 'hidden' },
  podiumNama: { fontSize: 10, fontWeight: '500', color: '#1A3A6B', textAlign: 'center', marginBottom: 3, maxWidth: 80 },
  podiumVotes: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  podiumVoteText: { fontSize: 10, color: '#4A6FA5' },
  podiumBase: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, alignItems: 'center', justifyContent: 'center' },
  podiumRankNum: { color: '#fff', fontWeight: '500', fontSize: 20 },

  // List
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#E8EDF5',
  },
  listRank: { fontSize: 13, fontWeight: '500', color: '#888', width: 22, textAlign: 'center' },
  listAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#B5D4F4' },
  listNama: { flex: 1, fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  voteChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F0FB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  voteChipText: { fontSize: 12, fontWeight: '500', color: '#1565C0' },
});