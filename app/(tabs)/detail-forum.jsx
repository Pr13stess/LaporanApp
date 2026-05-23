import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DetailForumScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [laporan, setLaporan] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const { data } = await supabase
        .from('laporan')
        .select('*')
        .eq('id', id)
        .single();
      setLaporan(data);
    };
    fetchDetail();
  }, [id]);

  if (!laporan) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>Halo, King!</Text>
        <TouchableOpacity>
          <Ionicons name="settings-sharp" size={26} color="#FFA500" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Top Upvoted</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-circle" size={28} color="#1565C0" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Card Detail */}
          <View style={styles.card}>
            {/* User Info */}
            <View style={styles.cardHeader}>
              <View style={styles.cardAvatar} />
              <Text style={styles.cardNama}>{laporan.nama}</Text>
            </View>

            {/* Foto */}
            <View style={styles.fotoBox}>
              {laporan.foto ? (
                <Image source={{ uri: laporan.foto }} style={styles.foto} />
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#ccc" />
                </View>
              )}
            </View>

            {/* Deskripsi */}
            <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>
            <Text style={styles.alamat}>📍 {laporan.alamat}</Text>

            {/* Upvote */}
            <View style={styles.upvoteRow}>
              <TouchableOpacity style={styles.upvoteBtn}>
                <Ionicons name="thumbs-up" size={20} color="#1565C0" />
                <Text style={styles.upvoteText}>Upvote</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Komentar */}
          <View style={styles.komentarSection}>
            <View style={styles.komentarItem}>
              <View style={styles.komentarAvatar} />
              <View style={styles.komentarBubble}>
                <Text style={styles.komentarNama}>JOKO SUSILONO • Admin</Text>
                <Text style={styles.komentarTeks}>Iya, saya juga lihat</Text>
              </View>
            </View>

            <View style={styles.komentarItemReply}>
              <Ionicons name="return-down-forward" size={18} color="#aaa" />
              <View style={styles.komentarAvatar} />
              <View style={styles.komentarBubble}>
                <Text style={styles.komentarNama}>JOKO SUSILONO</Text>
                <Text style={styles.komentarTeks}>Iya, saya juga lihat</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  },
  cardNama: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1565C0',
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
  fotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  komentarSection: {
    gap: 10,
    marginBottom: 20,
  },
  komentarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  komentarItemReply: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 20,
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
  komentarNama: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1565C0',
    marginBottom: 2,
  },
  komentarTeks: {
    fontSize: 13,
    color: '#333',
  },
});