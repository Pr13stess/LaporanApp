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

const ORANGE = '#e49400';
const FILTERS = ['Semua', 'Voucher', 'Fisik', 'Donasi'];

const KATEGORI_CONFIG = {
  voucher: { bg: '#FFF3E0', color: '#e49400', label: 'Voucher' },
  fisik: { bg: '#E8F5E9', color: '#2E7D32', label: 'Fisik' },
  donasi: { bg: '#E3F2FD', color: '#1565C0', label: 'Donasi' },
};

export default function VoucherListScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [redeemedIds, setRedeemedIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [userId, setUserId] = useState(null);

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
    setUserId(user.id);
    await Promise.all([fetchPoints(user.id), fetchVouchers(user.id)]);
    setLoading(false);
  };

  const fetchPoints = async (uid) => {
    const { data } = await supabase
      .from('user_points')
      .select('points, likes_redeemed')
      .eq('user_id', uid)
      .single();
    setUserPoints(data?.points || 0);
    setPointsRedeemed(data?.likes_redeemed || 0);
  };

  const fetchVouchers = async (uid) => {
    const { data: allVouchers } = await supabase
      .from('vouchers')
      .select('*')
      .gt('stok', 0)
      .order('points_required', { ascending: true });

    const { data: redeemed } = await supabase
      .from('voucher_redemptions')
      .select('voucher_id, points_used')
      .eq('user_id', uid);

    const ids = new Set((redeemed || []).map((r) => r.voucher_id));
    const totalRedeemed = (redeemed || []).reduce((sum, r) => sum + (r.points_used || 0), 0);

    setRedeemedIds(ids);
    setPointsRedeemed(totalRedeemed);
    setVouchers(allVouchers || []);
  };

  const handleRedeem = async () => {
    if (!selectedVoucher || redeeming) return;

    if (userPoints < selectedVoucher.points_required) {
      Alert.alert('Poin Kurang', `Kamu butuh ${selectedVoucher.points_required} poin untuk voucher ini.`);
      return;
    }

    setRedeeming(true);

    const { error } = await supabase.from('voucher_redemptions').insert({
      user_id: userId,
      voucher_id: selectedVoucher.id,
      points_used: selectedVoucher.points_required,
    });

    if (error) {
      Alert.alert('Gagal', 'Gagal menukar voucher, coba lagi.');
      setRedeeming(false);
      return;
    }

    await supabase
      .from('user_points')
      .update({ points: userPoints - selectedVoucher.points_required, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabase
      .from('vouchers')
      .update({ stok: selectedVoucher.stok - 1 })
      .eq('id', selectedVoucher.id);

    await supabase.from('point_history').insert({
      user_id: userId,
      points: -selectedVoucher.points_required,
      reason: `Tukar voucher: ${selectedVoucher.nama}`,
    });

    setRedeeming(false);
    setSelectedVoucher(null);
    Alert.alert('Berhasil! 🎉', `Voucher "${selectedVoucher.nama}" berhasil ditukar!`);
    fetchAll();
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeFilter === 'Semua') return true;
    return v.kategori?.toLowerCase() === activeFilter.toLowerCase();
  });

  const isRedeemed = (id) => redeemedIds.has(id);

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
              <Text style={styles.modalPoints}>{selectedVoucher?.points_required} poin</Text>
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
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setSelectedVoucher(null)}>
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnRedeem,
                  (userPoints < (selectedVoucher?.points_required || 0) || redeeming) && { opacity: 0.5 },
                ]}
                onPress={handleRedeem}
                disabled={userPoints < (selectedVoucher?.points_required || 0) || redeeming}
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
          <TouchableOpacity onPress={() => router.push('/(tabs)/kupon')}
            style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vouchermu</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ORANGE]} tintColor={ORANGE} />
          }
        >
          {/* Poin Summary Card — matches poinCard style */}
          <View style={styles.poinCard}>
            <Text style={styles.poinLabel}>Poin tersedia</Text>
            <Text style={styles.poinValue}>{userPoints}</Text>
            <View style={styles.poinDivider} />
            <View style={styles.poinSubRow}>
              <View style={styles.poinSubItem}>
                <Text style={styles.poinSubLabel}>Sudah ditukar</Text>
                <Text style={styles.poinSubValue}>{pointsRedeemed} poin</Text>
              </View>
              <View style={styles.poinSubSep} />
              <View style={styles.poinSubItem}>
                <Text style={styles.poinSubLabel}>Tersedia</Text>
                <Text style={[styles.poinSubValue, { color: ORANGE }]}>{filteredVouchers.length} voucher</Text>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={16} color={ORANGE} />
            <Text style={styles.sectionTitle}>Pilih kategori</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Section label */}
          <View style={[styles.sectionHeader, { marginTop: 4 }]}>
            <Ionicons name="gift-outline" size={16} color={ORANGE} />
            <Text style={styles.sectionTitle}>Tersedia untukmu</Text>
          </View>

          {/* Voucher Grid */}
          {filteredVouchers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={36} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada voucher tersedia</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredVouchers.map((v) => {
                const redeemed = isRedeemed(v.id);
                const canRedeem = userPoints >= v.points_required && !redeemed;
                const kat = KATEGORI_CONFIG[v.kategori?.toLowerCase()] || KATEGORI_CONFIG['voucher'];
                const isLowStock = v.stok <= 5;

                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.voucherCard, redeemed && styles.voucherCardRedeemed]}
                    onPress={() => !redeemed && setSelectedVoucher(v)}
                    activeOpacity={redeemed ? 1 : 0.85}
                  >
                    {/* Foto */}
                    {v.foto ? (
                      <Image source={{ uri: v.foto }} style={styles.voucherFoto} />
                    ) : (
                      <View style={[styles.voucherFotoPlaceholder, { backgroundColor: kat.bg }]}>
                        <Ionicons name="gift-outline" size={28} color={kat.color} />
                      </View>
                    )}

                    {/* Kategori Badge */}
                    <View style={[styles.katBadge, { backgroundColor: kat.bg }]}>
                      <Text style={[styles.katBadgeText, { color: kat.color }]}>{kat.label}</Text>
                    </View>

                    {/* Stok warning */}
                    {isLowStock && (
                      <Text style={styles.stokWarning}>Stok tersisa {v.stok}!</Text>
                    )}

                    {/* Info */}
                    <Text style={styles.voucherNama} numberOfLines={2}>{v.nama}</Text>
                    <Text style={styles.voucherSub} numberOfLines={1}>{v.deskripsi}</Text>

                    {/* Points badge */}
                    <View style={styles.voucherPointsRow}>
                      <Ionicons name="star" size={11} color={ORANGE} />
                      <Text style={styles.voucherPoints}>{v.points_required.toLocaleString()} poin</Text>
                    </View>

                    {/* Action Button */}
                    {redeemed ? (
                      <View style={[styles.actionBtn, styles.actionBtnRedeemed]}>
                        <Ionicons name="checkmark" size={13} color="#2E7D32" />
                        <Text style={[styles.actionBtnText, { color: '#2E7D32' }]}>Ditukar</Text>
                      </View>
                    ) : canRedeem ? (
                      <View style={[styles.actionBtn, styles.actionBtnActive]}>
                        <Text style={styles.actionBtnText}>Tukar</Text>
                      </View>
                    ) : (
                      <View style={[styles.actionBtn, styles.actionBtnDisabled]}>
                        <Text style={[styles.actionBtnText, { color: '#bbb' }]}>Kurang poin</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </>
  );
}

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

  // Header — same as kupon.jsx
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Content — same as kupon.jsx
  content: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },

  // Poin Card — same structure as kupon.jsx poinCard
  poinCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  poinDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  poinSubRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  poinSubItem: {
    flex: 1,
    alignItems: 'center',
  },
  poinSubSep: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F0',
  },
  poinSubLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  poinSubValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },

  // Section header — same as kupon.jsx
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

  // Filter
  filterScroll: {
    marginBottom: 18,
    flexGrow: 0,
  },
  filterContent: {
    gap: 8,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  filterPillActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  filterPillText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Empty state — same as kupon.jsx
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 13,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Voucher Card
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    width: '47.5%',
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
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  voucherFotoPlaceholder: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  // Kategori badge
  katBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 6,
  },
  katBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  stokWarning: {
    fontSize: 10,
    color: '#E53935',
    fontWeight: '600',
    marginBottom: 4,
  },

  voucherNama: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 2,
    lineHeight: 18,
  },
  voucherSub: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 6,
  },
  voucherPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  voucherPoints: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '700',
  },

  // Action button
  actionBtn: {
    borderRadius: 16,
    paddingVertical: 7,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnActive: {
    backgroundColor: ORANGE,
  },
  actionBtnDisabled: {
    backgroundColor: '#F0F0F0',
  },
  actionBtnRedeemed: {
    backgroundColor: '#E8F5E9',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal — same as kupon.jsx
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
