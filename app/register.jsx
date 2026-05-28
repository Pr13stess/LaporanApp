import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nama || !email || !password) {
      Alert.alert('Gagal', 'Semua field harus diisi!');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Gagal Daftar', error.message);
    } else {
      Alert.alert('Berhasil!', 'Akun berhasil dibuat! Silakan login.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.iconRing}>
          <Ionicons name="person-add" size={32} color="#fff" />
        </View>
        <Text style={styles.appName}>Buat Akun</Text>
        <Text style={styles.appSub}>Bergabung dan mulai laporkan masalah sekitarmu</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daftar</Text>
        <Text style={styles.cardSub}>Isi data diri kamu untuk memulai</Text>

        <Text style={styles.label}>NAMA LENGKAP</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="person-outline" size={18} color="#1565C0" style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="Nama lengkap kamu"
            placeholderTextColor="#aaa"
            value={nama}
            onChangeText={setNama}
          />
        </View>

        <Text style={styles.label}>EMAIL</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="mail-outline" size={18} color="#1565C0" style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="email@contoh.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>PASSWORD</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="lock-closed-outline" size={18} color="#1565C0" style={styles.fieldIcon} />
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnDaftar, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnDaftarText}>{loading ? 'Loading...' : 'Buat Akun'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Sudah punya akun? <Text style={styles.loginBold}>Masuk sekarang</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1565C0' },

  hero: {
    paddingHorizontal: 28, paddingTop: 56, paddingBottom: 48, overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', top: -50, right: -50,
  },
  circle2: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: -20,
  },
  iconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 },
  appSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 0.5 },

  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1565C0', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 20 },

  label: { fontSize: 11, fontWeight: '600', color: '#555', letterSpacing: 0.6, marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C9E5F5',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#F4FAFD', marginBottom: 16,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 14, color: '#333' },

  btnDaftar: {
    backgroundColor: '#FFA500', borderRadius: 20,
    paddingVertical: 14, alignItems: 'center', marginBottom: 18, marginTop: 4,
  },
  btnDaftarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { fontSize: 12, color: '#BBB' },

  loginRow: { alignItems: 'center' },
  loginText: { fontSize: 13, color: '#888' },
  loginBold: { color: '#1565C0', fontWeight: '700' },
});