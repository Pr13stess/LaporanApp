import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function DetailForumScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [laporan, setLaporan] = useState(null);
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [userId, setUserId] = useState(null);
  const [komentar, setKomentar] = useState([]);
  const [inputKomentar, setInputKomentar] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [fotoFullscreen, setFotoFullscreen] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likedKomentarIds, setLikedKomentarIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUser().then((uid) => {
        fetchDetail(uid);
        fetchKomentar(uid);
      });
    }, [id])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser().then((uid) =>
      Promise.all([fetchDetail(uid), fetchKomentar(uid)])
    );
    setRefreshing(false);
  }, [id]);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFoto(user.user_metadata?.foto || null);
      setUserId(user.id);
      return user.id;
    }
    return null;
  };

  const fetchDetail = async (uid) => {
    const { data } = await supabase
      .from('laporan')
      .select('*, profiles(nama, foto_profil)')
      .eq('id', id)
      .single();
    setLaporan(data);

    if (uid) {
      const { data: likeData } = await supabase
        .from('laporan_likes')
        .select('id')
        .eq('user_id', uid)
        .eq('laporan_id', id)
        .single();
      setIsLiked(!!likeData);
    }
  };

  const fetchKomentar = async (uid) => {
    const { data } = await supabase
      .from('komentar')
      .select('*, profiles(nama, foto_profil), reply:reply_to(profiles(nama))')
      .eq('laporan_id', id)
      .order('created_at', { ascending: true });
    if (data) setKomentar(data);

    if (uid && data?.length > 0) {
      const { data: likedData } = await supabase
        .from('komentar_likes')
        .select('komentar_id')
        .eq('user_id', uid);
      if (likedData) {
        setLikedKomentarIds(new Set(likedData.map((l) => l.komentar_id)));
      }
    }
  };

  const kirimKomentar = async () => {
    if (!inputKomentar.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('komentar').insert({
      laporan_id: id,
      user_id: user.id,
      isi: inputKomentar.trim(),
      reply_to: replyTo?.id || null,
    });

    if (error) {
      Alert.alert('Gagal', 'Gagal mengirim komentar!');
    } else {
      setInputKomentar('');
      setReplyTo(null);
      fetchKomentar(userId);
    }
  };

  const handleUpvote = async () => {
    if (!laporan || !userId) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLaporan((prev) => ({
      ...prev,
      upvotes: (prev.upvotes || 0) + (newIsLiked ? 1 : -1),
    }));

    if (newIsLiked) {
      await supabase
        .from('laporan_likes')
        .insert({ user_id: userId, laporan_id: id });
      await supabase.rpc('increment_laporan_upvotes', { laporan_id: id });
    } else {
      await supabase
        .from('laporan_likes')
        .delete()
        .eq('user_id', userId)
        .eq('laporan_id', id);
      await supabase.rpc('decrement_laporan_upvotes', { laporan_id: id });
    }
  };

  const handleUpvoteKomentar = async (item) => {
    if (!userId) return;

    const isLikedKomentar = likedKomentarIds.has(item.id);
    const newIsLiked = !isLikedKomentar;

    setLikedKomentarIds((prev) => {
      const s = new Set(prev);
      newIsLiked ? s.add(item.id) : s.delete(item.id);
      return s;
    });
    setKomentar((prev) =>
      prev.map((k) =>
        k.id === item.id
          ? { ...k, upvotes: (k.upvotes || 0) + (newIsLiked ? 1 : -1) }
          : k
      )
    );

    if (newIsLiked) {
      await supabase
        .from('komentar_likes')
        .insert({ user_id: userId, komentar_id: item.id });
      await supabase.rpc('increment_komentar_upvotes', {
        komentar_id: item.id,
      });
    } else {
      await supabase
        .from('komentar_likes')
        .delete()
        .eq('user_id', userId)
        .eq('komentar_id', item.id);
      await supabase.rpc('decrement_komentar_upvotes', {
        komentar_id: item.id,
      });
    }
  };

  const statusColor = (status) => {
    if (status === 'pending') return '#E53935';
    if (status === 'proses' || status === 'direview') return '#FFA500';
    if (status === 'selesai' || status === 'diterima') return '#2E7D32';
    return '#888';
  };

  if (!laporan) return null;

  return (
    <>
      {/* Fullscreen foto modal */}
      <Modal visible={!!fotoFullscreen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFotoFullscreen(null)}
        >
          <Image
            source={{ uri: fotoFullscreen }}
            style={styles.modalFoto}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/forum')}
              style={styles.headerBackBtn}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Laporan</Text>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#aaa" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#e49400']}
                  tintColor="#e49400"
                />
              }
            >
              {/* Laporan Card */}
              <View style={styles.card}>
                {/* Card Author Row */}
                <View style={styles.cardHeader}>
                  {laporan.profiles?.foto_profil ? (
                    <Image
                      source={{ uri: laporan.profiles.foto_profil }}
                      style={styles.cardAvatar}
                    />
                  ) : (
                    <View style={[styles.cardAvatar, styles.cardAvatarFallback]}>
                      <Ionicons name="person" size={14} color="#aaa" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardNama}>
                      {laporan.profiles?.nama || 'User'}
                    </Text>
                    <Text style={styles.cardTanggal}>{laporan.tanggal}</Text>
                  </View>
                  {/* Status badge — top right */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(laporan.status) }]}>
                    <Text style={styles.statusText}>{laporan.status}</Text>
                  </View>
                </View>

                {/* Judul */}
                <Text style={styles.judul}>{laporan.judul}</Text>

                {/* Alamat — Ionicons pin icon */}
                {laporan.alamat ? (
                  <View style={styles.alamatRow}>
                    <Ionicons
                      name="location-sharp"
                      size={13}
                      color="#e49400"
                    />
                    <Text style={styles.alamat} numberOfLines={2}>
                      {laporan.alamat}
                    </Text>
                  </View>
                ) : null}

                {/* Deskripsi */}
                <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>

                {/* Foto */}
                {laporan.foto ? (
                  <TouchableOpacity
                    onPress={() => setFotoFullscreen(laporan.foto)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.fotoBox}>
                      <Image
                        source={{ uri: laporan.foto }}
                        style={styles.foto}
                      />
                      <View style={styles.fotoOverlay}>
                        <Ionicons
                          name="expand-outline"
                          size={18}
                          color="#fff"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Footer actions */}
                <View style={styles.actionRow}>
                  {/* Upvote */}
                  <TouchableOpacity
                    style={[styles.upvoteBtn, isLiked && styles.upvoteBtnActive]}
                    onPress={handleUpvote}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-up" size={18} color="#fff" />
                    <Text style={styles.upvoteText}>
                      {laporan.upvotes || 0}
                    </Text>
                  </TouchableOpacity>
                  {/* Share */}
                  <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
                    <Ionicons
                      name="share-social-outline"
                      size={17}
                      color="#666"
                    />
                    <Text style={styles.shareBtnText}>Bagikan</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Komentar Section */}
              <View style={styles.komentarSection}>
                <View style={styles.komentarHeaderRow}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color="#e49400"
                  />
                  <Text style={styles.komentarTitle}>
                    Komentar ({komentar.length})
                  </Text>
                </View>

                {komentar.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={32}
                      color="#ccc"
                    />
                    <Text style={styles.komentarEmpty}>
                      Belum ada komentar. Jadilah yang pertama!
                    </Text>
                  </View>
                ) : (
                  komentar.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.komentarItem,
                        item.reply_to && styles.komentarReply,
                      ]}
                    >
                      {item.profiles?.foto_profil ? (
                        <Image
                          source={{ uri: item.profiles.foto_profil }}
                          style={styles.komentarAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.komentarAvatar,
                            styles.komentarAvatarFallback,
                          ]}
                        >
                          <Ionicons name="person" size={12} color="#aaa" />
                        </View>
                      )}
                      <View style={styles.komentarBubble}>
                        {item.reply_to && (
                          <View style={styles.replyChip}>
                            <Ionicons
                              name="return-down-forward"
                              size={11}
                              color="#e49400"
                            />
                            <Text style={styles.replyLabel}>
                              {item.reply?.profiles?.nama || 'User'}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.komentarNama}>
                          {item.profiles?.nama || 'User'}
                        </Text>
                        <Text style={styles.komentarTeks}>{item.isi}</Text>
                        <View style={styles.komentarActions}>
                          <TouchableOpacity
                            style={styles.replyBtn}
                            onPress={() => setReplyTo(item)}
                          >
                            <Ionicons
                              name="return-down-forward-outline"
                              size={13}
                              color="#888"
                            />
                            <Text style={styles.replyBtnText}>Balas</Text>
                          </TouchableOpacity>

                          {/* Upvote komentar */}
                          <TouchableOpacity
                            style={[styles.upvoteKomentarBtn, likedKomentarIds.has(item.id) && styles.upvoteKomentarBtnActive]}
                            onPress={() => handleUpvoteKomentar(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="arrow-up" size={14} color="#fff" />
                            <Text style={styles.upvoteKomentarText}>
                              {item.upvotes || 0}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Reply indicator */}
            {replyTo && (
              <View style={styles.replyIndicator}>
                <Ionicons
                  name="return-down-forward"
                  size={14}
                  color="#e49400"
                />
                <Text style={styles.replyIndicatorText} numberOfLines={1}>
                  Membalas{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {replyTo.profiles?.nama || 'User'}
                  </Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setReplyTo(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#bbb" />
                </TouchableOpacity>
              </View>
            )}

            {/* Input komentar */}
            <View style={styles.inputKomentarRow}>
              <TextInput
                style={styles.inputKomentar}
                placeholder={
                  replyTo
                    ? `Balas ${replyTo.profiles?.nama || 'User'}...`
                    : 'Tulis komentar...'
                }
                placeholderTextColor="#bbb"
                value={inputKomentar}
                onChangeText={setInputKomentar}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.btnKirimKomentar,
                  !inputKomentar.trim() && styles.btnKirimKomentarDisabled,
                ]}
                onPress={kirimKomentar}
                disabled={!inputKomentar.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const ORANGE = '#e49400';
const ORANGE_LIGHT = '#FFF3E0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.97)',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 14,
  },

  // ── Header ──────────────────────────────────
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
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Card Laporan ─────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  cardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  cardAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNama: {
    fontWeight: 'bold',
    fontSize: 14,
    color: ORANGE,
  },
  cardTanggal: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },

  // Status badge — refined pill
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  judul: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 22,
  },

  // Alamat row with icon
  alamatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 10,
    backgroundColor: ORANGE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alamat: {
    fontSize: 12,
    color: '#7a5200',
    flex: 1,
    lineHeight: 17,
  },

  deskripsi: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },

  fotoBox: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    height: 190,
    backgroundColor: '#eee',
    position: 'relative',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Upvote button — laporan
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upvoteBtnActive: {
    backgroundColor: '#FFA500',
  },
  upvoteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  upvoteTextActive: {
    color: '#fff',
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
  },
  shareBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  // ── Komentar Section ─────────────────────────
  komentarSection: {
    marginBottom: 8,
  },
  komentarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  komentarTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1a1a1a',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  komentarEmpty: {
    color: '#bbb',
    fontSize: 13,
    textAlign: 'center',
  },

  komentarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
  },
  komentarReply: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2.5,
    borderLeftColor: ORANGE,
  },
  komentarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    marginTop: 2,
  },
  komentarAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  komentarBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 11,
    flex: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // Reply chip inside bubble
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ORANGE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  replyLabel: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '600',
  },

  komentarNama: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  },
  komentarTeks: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 8,
  },
  komentarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },

  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyBtnText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },

  // Upvote komentar — same pattern as laporan
  upvoteKomentarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  upvoteKomentarBtnActive: {
    backgroundColor: '#FFA500',
  },
  upvoteKomentarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  upvoteKomentarTextActive: {
    color: '#fff',
  },

  // ── Reply Indicator ──────────────────────────
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ORANGE_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  replyIndicatorText: {
    flex: 1,
    fontSize: 12,
    color: '#7a5200',
  },

  // ── Input Komentar ───────────────────────────
  inputKomentarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#F5F5F5',
  },
  inputKomentar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    maxHeight: 100,
  },
  btnKirimKomentar: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnKirimKomentarDisabled: {
    backgroundColor: '#ddd',
  },

  // ── Modal ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFoto: {
    width: '100%',
    height: '80%',
  },
});