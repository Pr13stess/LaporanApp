import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ForumScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('terbaru');
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaporan();
  }, [sortBy]);

  const fetchLaporan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('laporan')
      .select('*')
      .order('tanggal', { ascending: sortBy === 'terlama' });

    if (!error) setLaporan(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>Halo, King!</Text>
        <TouchableOpacity>
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
              onPress={() => setSortBy(sortBy === 'terbaru' ? 'terlama' : 'terbaru')}
            >
              <Text style={styles.sortBtnText}>{sortBy}</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={laporan}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/detail-forum', params: { id: item.id } })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNama}>{item.nama}</Text>
                    <Text style={styles.cardTanggal}>{item.tanggal}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      item.status === 'pending' ? '#FFA500' :
                      item.status === 'proses' ? '#1565C0' : '#2E7D32'
                  }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardDeskripsi} numberOfLines={2}>{item.deskripsi}</Text>
                <Text style={styles.cardAlamat} numberOfLines={2}>📍 {item.alamat}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}