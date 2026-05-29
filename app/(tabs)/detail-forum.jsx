import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    await fetchUser().then((uid) => Promise.all([fetchDetail(uid), fetchKomentar(uid)]));
    setRefreshing(false);
  }, [id]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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

    // Cek apakah user sudah like laporan ini
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

    // Cek komentar mana yang sudah di-like user ini
    if (uid && data?.length > 0) {
      const { data: likedData } = await supabase
        .from('komentar_likes')
        .select('komentar_id')
        .eq('user_id', uid);
      if (likedData) {
        setLikedKomentarIds(new Set(likedData.map(l => l.komentar_id)));
      }
    }
  };

  const kirimKomentar = async () => {
    if (!inputKomentar.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
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

    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLaporan(prev => ({
      ...prev,
      upvotes: (prev.upvotes || 0) + (newIsLiked ? 1 : -1),
    }));

    if (newIsLiked) {
      await supabase.from('laporan_likes').insert({ user_id: userId, laporan_id: id });
      await supabase.rpc('increment_laporan_upvotes', { laporan_id: id });
    } else {
      await supabase.from('laporan_likes').delete()
        .eq('user_id', userId).eq('laporan_id', id);
      await supabase.rpc('decrement_laporan_upvotes', { laporan_id: id });
    }
  };

  const handleUpvoteKomentar = async (item) => {
    if (!userId) return;

    const isLikedKomentar = likedKomentarIds.has(item.id);
    const newIsLiked = !isLikedKomentar;

    // Optimistic update
    setLikedKomentarIds(prev => {
      const s = new Set(prev);
      newIsLiked ? s.add(item.id) : s.delete(item.id);
      return s;
    });
    setKomentar(prev =>
      prev.map(k => k.id === item.id
        ? { ...k, upvotes: (k.upvotes || 0) + (newIsLiked ? 1 : -1) }
        : k
      )
    );

    if (newIsLiked) {
      await supabase.from('komentar_likes').insert({ user_id: userId, komentar_id: item.id });
      await supabase.rpc('increment_komentar_upvotes', { komentar_id: item.id });
    } else {
      await supabase.from('komentar_likes').delete()
        .eq('user_id', userId).eq('komentar_id', item.id);
      await supabase.rpc('decrement_komentar_upvotes', { komentar_id: item.id });
    }
  };

  if (!laporan) return null;

  return (
    <>
      <Modal visible={!!fotoFullscreen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setFotoFullscreen(null)}>
          <Image source={{ uri: fotoFullscreen }} style={styles.modalFoto} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/forum')}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Laporan</Text>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </View>

          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} tintColor="#1565C0" />
              }
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  {laporan.profiles?.foto_profil ? (
                    <Image source={{ uri: laporan.profiles.foto_profil }} style={styles.cardAvatar} />
                  ) : (
                    <View style={styles.cardAvatar} />
                  )}
                  <View>
                    <Text style={styles.cardNama}>{laporan.profiles?.nama || 'User'}</Text>
                    <Text style={styles.cardTanggal}>{laporan.tanggal}</Text>
                  </View>
                </View>

                <Text style={styles.judul}>{laporan.judul}</Text>
                <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>

                {laporan.alamat ? <Text style={styles.alamat}>📍 {laporan.alamat}</Text> : null}

                {laporan.foto && (
                  <TouchableOpacity onPress={() => setFotoFullscreen(laporan.foto)}>
                    <View style={styles.fotoBox}>
                      <Image source={{ uri: laporan.foto }} style={styles.foto} />
                    </View>
                  </TouchableOpacity>
                )}

                <View style={styles.bottomRow}>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      laporan.status === 'pending' ? '#D32F2F' :
                      laporan.status === 'proses' ? '#1565C0' : '#2E7D32'
                  }]}>
                    <Text style={styles.statusText}>{laporan.status}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.upvoteBtn, isLiked && styles.upvoteBtnActive]}
                      onPress={handleUpvote}
                    >
                      <Ionicons
                        name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
                        size={18}
                        color={isLiked ? "#1565C0" : "#555"}
                      />
                      <Text style={[styles.upvoteText, isLiked && styles.upvoteTextActive]}>
                        {laporan.upvotes || 0}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareBtn}>
                      <Ionicons name="share-social-outline" size={18} color="#555" />
                      <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.komentarTitle}>Komentar ({komentar.length})</Text>
              {komentar.length === 0 ? (
                <Text style={styles.komentarEmpty}>Belum ada komentar. Jadilah yang pertama!</Text>
              ) : (
                komentar.map((item) => (
                  <View key={item.id} style={[styles.komentarItem, item.reply_to && styles.komentarReply]}>
                    {item.profiles?.foto_profil ? (
                      <Image source={{ uri: item.profiles.foto_profil }} style={styles.komentarAvatar} />
                    ) : (
                      <View style={styles.komentarAvatar} />
                    )}
                    <View style={styles.komentarBubble}>
                      {item.reply_to && (
                        <Text style={styles.replyLabel}>
                          ↩ Membalas {item.reply?.profiles?.nama || 'User'}
                        </Text>
                      )}
                      <Text style={styles.komentarNama}>{item.profiles?.nama || 'User'}</Text>
                      <Text style={styles.komentarTeks}>{item.isi}</Text>
                      <View style={styles.komentarActions}>
                        <TouchableOpacity style={styles.replyBtn} onPress={() => setReplyTo(item)}>
                          <Ionicons name="return-down-forward-outline" size={14} color="#1565C0" />
                          <Text style={styles.replyBtnText}>Balas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.upvoteKomentarBtn, likedKomentarIds.has(item.id) && styles.upvoteKomentarBtnActive]}
                          onPress={() => handleUpvoteKomentar(item)}
                        >
                          <Ionicons name="arrow-up" size={14} color="#1565C0" />
                          <Text style={[styles.upvoteKomentarText, likedKomentarIds.has(item.id) && styles.upvoteKomentarTextActive]}>
                            {item.upvotes || 0}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {replyTo && (
              <View style={styles.replyIndicator}>
                <Text style={styles.replyIndicatorText}>
                  ↩ Membalas {replyTo.profiles?.nama || 'User'}
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Ionicons name="close-circle" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputKomentarRow}>
              <TextInput
                style={styles.inputKomentar}
                placeholder={replyTo ? `Balas ${replyTo.profiles?.nama || 'User'}...` : 'Tulis komentar...'}
                placeholderTextColor="#aaa"
                value={inputKomentar}
                onChangeText={setInputKomentar}
              />
              <TouchableOpacity style={styles.btnKirimKomentar} onPress={kirimKomentar}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#1565C0',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },

  // Card Laporan
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  cardNama: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1565C0',
  },
  cardTanggal: {
    fontSize: 11,
    color: '#888',
  },
  judul: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 6,
  },
  deskripsi: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
  alamat: {
    fontSize: 11,
    color: '#888',
    marginBottom: 10,
  },
  fotoBox: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    height: 180,
    backgroundColor: '#eee',
  },
  foto: {
    width: '100%',
    height: '100%',
  },

  // Status & Actions
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Upvote & Share
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upvoteBtnActive: {
    backgroundColor: '#E3F2FD',
  },
  upvoteText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  upvoteTextActive: {
    color: '#1565C0',
    fontWeight: 'bold',
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

  // Komentar
  komentarTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1565C0',
    marginBottom: 10,
  },
  komentarEmpty: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  komentarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  komentarReply: {
    paddingLeft: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#1565C0',
    marginLeft: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
  },
  komentarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#90CAF9',
    overflow: 'hidden',
  },
  komentarBubble: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    flex: 1,
    elevation: 1,
  },
  komentarNama: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1565C0',
    marginBottom: 2,
  },
  komentarTeks: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  komentarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },

  // Reply
  replyLabel: {
    fontSize: 11,
    color: '#1565C0',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyBtnText: {
    fontSize: 12,
    color: '#1565C0',
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#1565C0',
    fontStyle: 'italic',
  },

  // Upvote Komentar
  upvoteKomentarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  upvoteKomentarBtnActive: {
    backgroundColor: '#BBDEFB',
  },
  upvoteKomentarText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: 'bold',
  },
  upvoteKomentarTextActive: {
    color: '#0D47A1',
  },

  // Input Komentar
  inputKomentarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#F5F5F5',
  },
  inputKomentar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  btnKirimKomentar: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFoto: {
    width: '100%',
    height: '80%',
  },
});