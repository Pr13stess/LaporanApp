import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function DetailForumScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [laporan, setLaporan] = useState(null);
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [komentar, setKomentar] = useState([]);
  const [inputKomentar, setInputKomentar] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [fotoFullscreen, setFotoFullscreen] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      fetchDetail();
      fetchUser();
      fetchKomentar();
    }, [id])
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setNama(user.user_metadata?.nama || 'User');
      setFoto(user.user_metadata?.foto || null);
    }
  };

  const fetchDetail = async () => {
    const { data } = await supabase
      .from('laporan')
      .select('*')
      .eq('id', id)
      .single();
    setLaporan(data);
  };

  const fetchKomentar = async () => {
    const { data } = await supabase
      .from('komentar')
      .select('*')
      .eq('laporan_id', id)
      .order('created_at', { ascending: true });
    if (data) setKomentar(data);
  };

  const kirimKomentar = async () => {
    if (!inputKomentar.trim()) return;
    const { error } = await supabase.from('komentar').insert({
      laporan_id: id,
      nama,
      isi: inputKomentar.trim(),
      reply_to: replyTo?.id || null,
      reply_to_nama: replyTo?.nama || null,
    });
    if (error) {
      Alert.alert('Gagal', 'Gagal mengirim komentar');
    } else {
      setInputKomentar('');
      setReplyTo(null);
      fetchKomentar();
    }
  };

  const handleUpvoteKomentar = async (item) => {
    const { error } = await supabase
      .from('komentar')
      .update({ upvotes: (item.upvotes || 0) + 1 })
      .eq('id', item.id);
    if (!error) fetchKomentar();
  };

  const handleUpvote = async () => {
    if (!laporan) return;
    const { error } = await supabase
      .from('laporan')
      .update({ upvotes: (laporan.upvotes || 0) + 1 })
      .eq('id', id);
    if (!error) fetchDetail();
  };

  if (!laporan) return null;

  return ( 
 <>
    {/* Modal Fullscreen Foto */}
    <Modal visible={!!fotoFullscreen} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Detail Laporan</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-circle" size={28} color="#1565C0" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Card Detail */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {laporan.foto_profil ? (
                  <Image source={{ uri: laporan.foto_profil }} style={styles.cardAvatar} />
                ) : (
                  <View style={styles.cardAvatar} />
                )}
                <View>
                  <Text style={styles.cardNama}>{laporan.nama}</Text>
                  <Text style={styles.cardTanggal}>{laporan.tanggal}</Text>
                </View>
              </View>

              <Text style={styles.judul}>{laporan.judul}</Text>
              <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>

              {laporan.alamat ? (
                <Text style={styles.alamat}>📍 {laporan.alamat}</Text>
              ) : null}

              {laporan.foto && (
                <TouchableOpacity onPress={() => setFotoFullscreen(laporan.foto)}>
                  <View style={styles.fotoBox}>
                    <Image source={{ uri: laporan.foto }} style={styles.foto} />
                  </View>
                </TouchableOpacity>
              )}

              <View style={[styles.statusBadge, {
                backgroundColor:
                  laporan.status === 'pending' ? '#FFA500' :
                  laporan.status === 'proses' ? '#1565C0' : '#2E7D32'
              }]}>
                <Text style={styles.statusText}>{laporan.status}</Text>
              </View>

              <View style={styles.upvoteRow}>
                <TouchableOpacity style={styles.upvoteBtn} onPress={handleUpvote}>
                  <Ionicons name="thumbs-up" size={20} color="#1565C0" />
                  <Text style={styles.upvoteText}>Upvote ({laporan.upvotes || 0})</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Komentar */}
            <Text style={styles.komentarTitle}>Komentar ({komentar.length})</Text>
            {komentar.length === 0 ? (
              <Text style={styles.komentarEmpty}>Belum ada komentar. Jadilah yang pertama!</Text>
            ) : (
              komentar.map((item) => (
                <View key={item.id} style={[styles.komentarItem, item.reply_to && styles.komentarReply]}>
                  <View style={styles.komentarAvatar} />
                  <View style={styles.komentarBubble}>
                    {item.reply_to_nama && (
                      <Text style={styles.replyLabel}>↩ Membalas {item.reply_to_nama}</Text>
                    )}
                    <Text style={styles.komentarNama}>{item.nama}</Text>
                    <Text style={styles.komentarTeks}>{item.isi}</Text>
                    <View style={styles.komentarActions}>
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => setReplyTo(item)}
                      >
                        <Ionicons name="return-down-forward-outline" size={14} color="#1565C0" />
                        <Text style={styles.replyBtnText}>Balas</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.upvoteKomentarBtn}
                        onPress={() => handleUpvoteKomentar(item)}
                      >
                        <Ionicons name="arrow-up" size={14} color="#1565C0" />
                        <Text style={styles.upvoteKomentarText}>{item.upvotes || 0}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Reply indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>↩ Membalas {replyTo.nama}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Komentar */}
          <View style={styles.inputKomentarRow}>
            <TextInput
              style={styles.inputKomentar}
              placeholder={replyTo ? `Balas ${replyTo.nama}...` : 'Tulis komentar...'}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  },
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
  upvoteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upvoteText: {
    color: '#1565C0',
    fontWeight: 'bold',
    fontSize: 13,
  },
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
  backgroundColor: '#F0F4FF', // sedikit beda dari putih
  borderRadius: 8,
  },
  komentarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#90CAF9',
  },
  komentarBubble: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    flex: 1,
    elevation: 1,
  },
  replyLabel: {
    fontSize: 11,
    color: '#1565C0',
    marginBottom: 4,
    fontStyle: 'italic',
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
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyBtnText: {
    fontSize: 12,
    color: '#1565C0',
  },
  upvoteKomentarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  upvoteKomentarText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: 'bold',
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