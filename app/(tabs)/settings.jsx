import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email);
      setNama(user.user_metadata?.nama || '');
    }
  };

  const handleSimpan = async () => {
    setLoading(true);
    const { error: metaError } = await supabase.auth.updateUser({
      email,
      data: { nama },
    });
    setLoading(false);

    if (metaError) {
      Alert.alert('Gagal', metaError.message);
    } else {
      Alert.alert('Berhasil!', 'Profil berhasil diperbarui!');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.sectionTitle}>Informasi Akun</Text>

        <Text style={styles.label}>Nama</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama Lengkap"
          placeholderTextColor="#aaa"
          value={nama}
          onChangeText={setNama}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.btnSimpan, loading && { opacity: 0.7 }]}
          onPress={handleSimpan}
          disabled={loading}
        >
          <Text style={styles.btnSimpanText}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.btnLogoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#333',
  },
  btnSimpan: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  btnSimpanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnLogout: {
    backgroundColor: '#E53935',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnLogoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});