import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const ORANGE = '#e49400';
const PERIOD_FILTERS = ['Mingguan', 'Bulanan', 'All Time'];
const PODIUM_COLORS = { 1: '#e49400', 2: '#4CAF50', 3: '#2196F3' };
const PODIUM_HEIGHTS = { 1: 110, 2: 78, 3: 58 };

export default function LeaderboardScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activePeriod, setActivePeriod] = useState('Mingguan');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({ selesai: 0, upvotes: 0, poin: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [activePeriod])
  );

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setNama(user.user_metadata?.nama || 'User');
    setFoto(user.user_metadata?.foto || null);
    await Promise.all([fetchLeaderboard(user.id), fetchUserStats(user.id)]);
    setLoading(false);
  };

  const fetchLeaderboard = async (uid) => {
    let dateFilter = null;
    const now = new Date();
    if (activePeriod === 'Mingguan') {
      const d = new Date(now); d.setDate(now.getDate() - 7);
      dateFilter = d.toISOString();
    } else if (activePeriod === 'Bulanan') {
      const d = new Date(now); d.setMonth(now.getMonth() - 1);
      dateFilter = d.toISOString();
    }

    // Query user_points dan profiles secara terpisah
    const [pointsRes, profilesRes] = await Promise.all([
      supabase.from('user_points').select('user_id, points').order('points', { ascending: false }).limit(10),
      supabase.from('profiles').select('id, nama, foto_profil'),
    ]);
      console.log('pointsRes:', JSON.stringify(pointsRes.data));
      console.log('pointsErr:', pointsRes.error);
      console.log('profilesRes:', JSON.stringify(profilesRes.data));

    if (pointsRes.error || !pointsRes.data) return;

    // Buat map profiles berdasarkan id
    const profileMap = {};
    (profilesRes.data || []).forEach((p) => { profileMap[p.id] = p; });

    if (dateFilter) {
      const { data: historyData } = await supabase
        .from('point_history')
        .select('user_id, points')
        .gte('created_at', dateFilter);

      const periodMap = {};
      (historyData || []).forEach(({ user_id, points }) => {
        if (points > 0) periodMap[user_id] = (periodMap[user_id] || 0) + points;
      });

      const sorted = pointsRes.data
        .map((item) => {
          const profile = profileMap[item.user_id];
          return {
            id: item.user_id,
            userId: item.user_id,
            nama: profile?.nama || 'User',
            foto_profil: profile?.foto_profil || null,
            poin: periodMap[item.user_id] || 0,
            isCurrentUser: item.user_id === uid,
          };
        })
        .filter((item) => item.poin > 0)
        .sort((a, b) => b.poin - a.poin)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      const userInList = sorted.find((item) => item.isCurrentUser);
      if (!userInList) {
        const profile = profileMap[uid];
        sorted.push({
          id: uid,
          userId: uid,
          nama: profile?.nama || 'User',
          foto_profil: profile?.foto_profil || null,
          poin: 0,
          isCurrentUser: true,
          rank: sorted.length + 1,
        });
      }
      setLeaderboard(sorted.slice(0, 10));
    } else {
      const sorted = pointsRes.data.map((item, index) => {
        const profile = profileMap[item.user_id];
        return {
          id: item.user_id,
          userId: item.user_id,
          nama: profile?.nama || 'User',
          foto_profil: profile?.foto_profil || null,
          poin: item.points || 0,
          isCurrentUser: item.user_id === uid,
          rank: index + 1,
        };
      });
      setLeaderboard(sorted.slice(0, 10));
    }
  };

  const fetchUserStats = async (uid) => {
    const [selesaiRes, upvotesRes, poinRes] = await Promise.all([
      supabase.from('laporan').select('id', { count: 'exact' }).eq('user_id', uid).eq('status', 'selesai'),
      supabase.from('laporan').select('upvotes').eq('user_id', uid),
      supabase.from('user_points').select('points').eq('user_id', uid).single(),
    ]);
    const totalUpvotes = (upvotesRes.data || []).reduce((sum, l) => sum + (l.upvotes || 0), 0);
    setUserStats({
      selesai: selesaiRes.count || 0,
      upvotes: totalUpvotes,
      poin: poinRes.data?.points || 0,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [activePeriod]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUserRank = leaderboard.find((item) => item.isCurrentUser)?.rank;

  const Avatar = ({ uri, size = 44, borderColor = '#E0E0E0' }) => (
    uri
      ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor, overflow: 'hidden', backgroundColor: '#eee' }} />
      : <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person" size={size * 0.4} color="#bbb" />
        </View>
  );

  const PodiumCol = ({ item, rankKey }) => {
    if (!item) return <View style={{ flex: 1 }} />;
    const isFirst = rankKey === 1;
    return (
      <View style={styles.podiumCol}>
        {isFirst && (
          <Ionicons name="trophy" size={20} color={ORANGE} style={{ marginBottom: 4 }} />
        )}
        <Avatar
          uri={item.foto_profil}
          size={isFirst ? 54 : 44}
          borderColor={PODIUM_COLORS[rankKey]}
        />
        <Text style={styles.podiumNama} numberOfLines={1}>{item.nama}</Text>
        <Text style={styles.podiumPoin}>{item.poin} poin</Text>
        {/* Bar */}
        <View style={[styles.podiumBar, {
          backgroundColor: PODIUM_COLORS[rankKey],
          height: PODIUM_HEIGHTS[rankKey],
        }]}>
          <Text style={[styles.podiumRankNum, isFirst && { fontSize: 28 }]}>{rankKey}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={foto} size={40} borderColor="#fff" />
          <Text style={styles.headerTitle}>Halo, {nama}!</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-sharp" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Period Filter */}
        <View style={styles.filterRow}>
          {PERIOD_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activePeriod === f && styles.filterPillActive]}
              onPress={() => setActivePeriod(f)}
            >
              <Text style={[styles.filterPillText, activePeriod === f && styles.filterPillTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={36} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada data leaderboard</Text>
          </View>
        ) : (
          <FlatList
            data={rest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ORANGE]} tintColor={ORANGE} />
            }
            ListHeaderComponent={() => (
              <>
                {/* Podium Top 3 */}
                {top3.length >= 3 && (
                  <View style={styles.podiumWrap}>
                    <PodiumCol item={top3[1]} rankKey={2} />
                    <PodiumCol item={top3[0]} rankKey={1} />
                    <PodiumCol item={top3[2]} rankKey={3} />
                  </View>
                )}

                {/* Peringkat lainnya label */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="list-outline" size={16} color={ORANGE} />
                  <Text style={styles.sectionTitle}>Peringkat lainnya</Text>
                </View>
              </>
            )}
            ListFooterComponent={() => (
              <>
                {/* Stats user — 3 kartu terpisah */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Ionicons name="person-circle-outline" size={16} color={ORANGE} />
                  <Text style={styles.sectionTitle}>
                    Statistikmu{currentUserRank ? ` • Peringkat #${currentUserRank}` : ''}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" style={{ marginBottom: 6 }} />
                    <Text style={styles.statValue}>{userStats.selesai}</Text>
                    <Text style={styles.statLabel}>Laporan selesai</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#1565C0" style={{ marginBottom: 6 }} />
                    <Text style={styles.statValue}>{userStats.upvotes}</Text>
                    <Text style={styles.statLabel}>Upvote diterima</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="star-outline" size={20} color={ORANGE} style={{ marginBottom: 6 }} />
                    <Text style={[styles.statValue, { color: ORANGE }]}>{userStats.poin}</Text>
                    <Text style={styles.statLabel}>Total poin</Text>
                  </View>
                </View>
                <View style={{ height: 80 }} />
              </>
            )}
            renderItem={({ item }) => (
              <View style={[styles.listItem, item.isCurrentUser && styles.listItemMe]}>
                <Text style={[styles.listRank, item.isCurrentUser && { color: ORANGE }]}>
                  {item.rank}
                </Text>
                <Avatar
                  uri={item.foto_profil}
                  size={34}
                  borderColor={item.isCurrentUser ? ORANGE : '#E0E0E0'}
                />
                <Text style={[styles.listNama, item.isCurrentUser && { color: ORANGE, fontWeight: 'bold' }]} numberOfLines={1}>
                  {item.isCurrentUser ? 'You' : item.nama}
                </Text>
                <Text style={[styles.listPoin, item.isCurrentUser && { color: ORANGE }]}>
                  {item.poin} poin
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1, backgroundColor: 'rgba(20,20,20,0.97)',
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: {
    color: '#fff', fontWeight: 'bold', fontSize: 17,
  },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center',
  },

  // Body
  body: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16,
  },

  // Filter
  filterRow: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
  },
  filterPill: {
    flex: 1, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2,
  },
  filterPillActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  filterPillText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterPillTextActive: { color: '#fff', fontWeight: 'bold' },

  // Podium
  podiumWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', gap: 8, marginBottom: 24, paddingHorizontal: 4,
  },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumNama: {
    fontSize: 11, fontWeight: '600', color: '#1a1a1a',
    textAlign: 'center', marginTop: 6, marginBottom: 2, maxWidth: 90,
  },
  podiumPoin: { fontSize: 10, color: '#888', marginBottom: 6 },
  podiumBar: {
    width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumRankNum: { color: '#fff', fontWeight: 'bold', fontSize: 22 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },

  // List items
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 6, borderRadius: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2,
  },
  listItemMe: {
    backgroundColor: '#FFF8EC', borderWidth: 1, borderColor: '#F5D580',
  },
  listRank: { fontSize: 14, fontWeight: '600', color: '#999', width: 24, textAlign: 'center' },
  listNama: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  listPoin: { fontSize: 13, fontWeight: '600', color: '#888' },

  // Stats cards
  statsRow: {
    flexDirection: 'row', gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#999', textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { color: '#bbb', fontSize: 13 },
});
