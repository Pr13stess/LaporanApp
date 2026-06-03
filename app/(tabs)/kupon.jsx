import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const LEVEL_CONFIG = [
  { label: 'Warga Baru', min: 0, max: 50 },
  { label: 'Warga Aktif', min: 50, max: 200 },
  { label: 'Pelapor Andal', min: 200, max: 500 },
  { label: 'Pelapor Ahli', min: 500, max: 1000 },
  { label: 'Pahlawan Kota', min: 1000, max: Infinity },
];

const getLevel = (points) =>
  LEVEL_CONFIG.find((l) => points >= l.min && points < l.max) || LEVEL_CONFIG[0];

const REASON_ICON = {
  'Laporan diproses': { icon: 'reload-circle', color: '#FFA500' },
  'Laporan diselesaikan': { icon: 'checkmark-circle', color: '#2E7D32' },
};
const defaultReasonIcon = { icon: 'star', color: '#e49400' };

export default function VoucherScreen() {
  const router = useRouter();
  const [userPoints, setUserPoints] = useState(null);
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({ laporan: 0, selesai: 0, upvotes: 0, komentar: 0 });
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [weeklyRank, setWeeklyRank] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setNama(user.user_metadata?.nama || 'User');
    setFoto(user.user_metadata?.foto || null);

    await Promise.all([
      fetchUserPoints(user.id),
      fetchHistory(user.id),
      fetchVouchers(user.id),
      fetchStats(user.id),
      fetchWeeklyRank(user.id),
    ]);

    setLoading(false);
  };

  const fetchUserPoints = async (uid) => {
    const { data } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', uid)
      .single();
    setUserPoints(data || { points: 0, total_likes_earned: 0, likes_redeemed: 0 });
  };

  const fetchHistory = async (uid) => {
    const { data } = await supabase
      .from('point_history')
      .select('*, laporan(judul)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const fetchVouchers = async (uid) => {
    const { data: allVouchers } = await supabase
      .from('vouchers')
      .select('*')
      .gt('stok', 0)
      .order('points_required', { ascending: true });

    const { data: redeemed } = await supabase
      .from('voucher_redemptions')
      .select('voucher_id')
      .eq('user_id', uid);

    const redeemedIds = new Set((redeemed || []).map((r) => r.voucher_id));

    setVouchers(
      (allVouchers || []).map((v) => ({
        ...v,
        already_redeemed: redeemedIds.has(v.id),
      }))
    );
  };

  const fetchStats = async (uid) => {
    const [laporan, selesai, upvotes, komentar] = await Promise.all([
      supabase.from('laporan').select('id', { count: 'exact' }).eq('user_id', uid),
      supabase.from('laporan').select('id', { count: 'exact' }).eq('user_id', uid).eq('status', 'selesai'),
      supabase.from('laporan').select('upvotes').eq('user_id', uid),
      supabase.from('komentar').select('id', { count: 'exact' }).eq('user_id', uid),
    ]);

    const totalUpvotes = (upvotes.data || []).reduce((sum, l) => sum + (l.upvotes || 0), 0);

    setStats({
      laporan: laporan.count || 0,
      selesai: selesai.count || 0,
      upvotes: totalUpvotes,
      komentar: komentar.count || 0,
    });
  };

  const fetchWeeklyRank = async (uid) => {
    const { data } = await supabase
      .from('user_points')
      .select('user_id, points')
      .order('points', { ascending: false });

    if (data) {
      const rank = data.findIndex((r) => r.user_id === uid) + 1;
      setWeeklyRank(rank || null);
    }
  };

  const handleRedeem = async () => {
    if (!selectedVoucher || redeeming) return;
    const points = userPoints?.points || 0;

    if (points < selectedVoucher.points_required) {
      Alert.alert('Poin Kurang', `Kamu butuh ${selectedVoucher.points_required} poin untuk voucher ini.`);
      return;
    }

    setRedeeming(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error: redeemError } = await supabase
      .from('voucher_redemptions')
      .insert({
        user_id: user.id,
        voucher_id: selectedVoucher.id,
        points_used: selectedVoucher.points_required,
      });

    if (redeemError) {
      Alert.alert('Gagal', 'Gagal menukar voucher, coba lagi.');
      setRedeeming(false);
      return;
    }

    // Kurangi poin user
    await supabase
      .from('user_points')
      .update({ points: points - selectedVoucher.points_required, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Kurangi stok voucher
    await supabase
      .from('vouchers')
      .update({ stok: selectedVoucher.stok - 1 })
      .eq('id', selectedVoucher.id);

    // Catat history
    await supabase.from('point_history').insert({
      user_id: user.id,
      points: -selectedVoucher.points_required,
      reason: `Tukar voucher: ${selectedVoucher.nama}`,
    });

    setRedeeming(false);
    setSelectedVoucher(null);
    Alert.alert('Berhasil! 🎉', `Voucher "${selectedVoucher.nama}" berhasil ditukar!`);
    fetchAll();
  };

  const points = userPoints?.points || 0;
  const level = getLevel(points);
  const nextLevel = LEVEL_CONFIG[LEVEL_CONFIG.indexOf(level) + 1];
  const progressPercent = nextLevel
    ? Math.min(((points - level.min) / (nextLevel.min - level.min)) * 100, 100)
    : 100;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <>
      {/* Redeem Modal */}
      <Modal visible={!!selectedVoucher} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedVoucher?.foto ? (
              <Image source={{ uri: selectedVoucher.foto }} style={styles.modalFoto} />
            ) : (
              <View style={styles.modalFotoPlaceholder}>
                <Ionicons name="gift-outline" size={40} color={ORANGE} />
              </View>
            )}
            <Text style={styles.modalTitle}>{selectedVoucher?.nama}</Text>
            <Text style={styles.modalDesc}>{selectedVoucher?.deskripsi}</Text>

            <View style={styles.modalPointsRow}>
              <Ionicons name="star" size={16} color={ORANGE} />
              <Text style={styles.modalPoints}>
                {selectedVoucher?.points_required} poin
              </Text>
            </View>

            {selectedVoucher?.expired_at && (
              <Text style={styles.modalExpiry}>
                Berlaku hingga:{' '}
                {new Date(selectedVoucher.expired_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setSelectedVoucher(null)}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnRedeem,
                  (points < (selectedVoucher?.points_required || 0) || redeeming) && { opacity: 0.5 },
                ]}
                onPress={handleRedeem}
                disabled={points < (selectedVoucher?.points_required || 0) || redeeming}
              >
                <Text style={styles.modalBtnRedeemText}>
                  {redeeming ? 'Menukar...' : 'Tukar Sekarang'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#aaa" />
              </View>
            )}
            <View>
              <Text style={styles.headerNama}>Halo, {nama}!</Text>
              <Text style={styles.headerSub}>Poin</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-sharp" size={18} color={ORANGE} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ORANGE]} tintColor={ORANGE} />
          }
        >
          {/* Poin Card */}
          <View style={styles.poinCard}>
            <Text style={styles.poinLabel}>Total poin kamu</Text>
            <Text style={styles.poinValue}>{points}</Text>
            {weeklyRank && (
              <Text style={styles.poinRank}>Peringkat #{weeklyRank} minggu ini</Text>
            )}

            {/* Level Progress */}
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Level: {level.label}</Text>
              {nextLevel && (
                <Text style={styles.levelProgress}>
                  {points} / {nextLevel.min}
                </Text>
              )}
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            {nextLevel && (
              <Text style={styles.levelNextHint}>
                {nextLevel.min - points} poin lagi ke level {nextLevel.label}
              </Text>
            )}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Laporan dibuat', value: stats.laporan, icon: 'document-text-outline' },
              { label: 'Laporan selesai', value: stats.selesai, icon: 'checkmark-done-outline' },
              { label: 'Upvote diterima', value: stats.upvotes, icon: 'arrow-up-circle-outline' },
              { label: 'Komentar aktif', value: stats.komentar, icon: 'chatbubble-outline' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon} size={18} color={ORANGE} style={{ marginBottom: 6 }} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Voucher Section */}
          <TouchableOpacity
            style={styles.voucherBtn}
            onPress={() => router.push('/voucher-list')}
            activeOpacity={0.85}
          >
            <Ionicons name="gift-outline" size={20} color="#fff" />
            <Text style={styles.voucherBtnText}>Tukar / pakai poinmu disini!</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Riwayat Poin */}
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Ionicons name="time-outline" size={16} color={ORANGE} />
            <Text style={styles.sectionTitle}>Riwayat pendapatan poin</Text>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada riwayat poin</Text>
            </View>
          ) : (
            history.map((item) => {
              const reasonIcon =
                Object.entries(REASON_ICON).find(([key]) =>
                  item.reason.startsWith(key)
                )?.[1] || defaultReasonIcon;
              const isPositive = item.points > 0;
              return (
                <View key={item.id} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: reasonIcon.color + '22' }]}>
                    <Ionicons name={reasonIcon.icon} size={18} color={reasonIcon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyReason}>{item.reason}</Text>
                    <Text style={styles.historyJudul} numberOfLines={1}>
                      {item.laporan?.judul || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.historyPoints, { color: isPositive ? '#2E7D32' : '#E53935' }]}>
                    {isPositive ? '+' : ''}{item.points}
                  </Text>
                </View>
              );
            })
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </>
  );
}

const ORANGE = '#e49400';
const WHITE = '#fff'

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.97)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  avatarFallback: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNama: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerSub: {
    color: '#888',
    fontSize: 12,
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
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },

  // Poin Card
  poinCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  poinLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  poinValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: ORANGE,
    lineHeight: 60,
  },
  poinRank: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 14,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  levelProgress: {
    fontSize: 12,
    color: ORANGE,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 4,
  },
  levelNextHint: {
    fontSize: 11,
    color: '#bbb',
    alignSelf: 'flex-end',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: '47.5%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 13,
  },

  // Voucher card
  voucherBtn: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  voucherBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  voucherCardRedeemed: {
    opacity: 0.6,
  },
  voucherFoto: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  voucherFotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherNama: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  voucherDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  voucherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  voucherPoints: {
    fontSize: 12,
    color: ORANGE,
    fontWeight: '700',
  },
  voucherStok: {
    fontSize: 11,
    color: '#bbb',
  },
  tukarBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tukarBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  kurangPoinBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kurangPoinText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '700',
  },
  redeemedBadge: {
    alignItems: 'center',
    gap: 2,
  },
  redeemedText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // History
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyReason: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyJudul: {
    fontSize: 11,
    color: '#aaa',
  },
  historyPoints: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalFoto: {
    width: 80,
    height: 80,
    borderRadius: 14,
    marginBottom: 14,
  },
  modalFotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  modalPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  modalPoints: {
    fontSize: 15,
    fontWeight: 'bold',
    color: ORANGE,
  },
  modalExpiry: {
    fontSize: 11,
    color: '#bbb',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  modalBtnRedeem: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnRedeemText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
});
