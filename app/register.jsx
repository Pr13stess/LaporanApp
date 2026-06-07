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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="megaphone" size={20} color="#1a1a1a" />
          </View>
          <Text style={styles.logoText}>MariLapor!</Text>
        </View>
        <Text style={styles.headerTitle}>Buat Akun Baru</Text>
        <Text style={styles.headerSub}>Bergabung dan mulai laporkan masalah di sekitarmu</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daftar</Text>
        <Text style={styles.cardSub}>Isi data diri kamu untuk memulai</Text>

        <Text style={styles.label}>NAMA LENGKAP</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="person-outline" size={18} color="#FFA500" style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="Nama lengkap kamu"
            placeholderTextColor="#bbb"
            value={nama}
            onChangeText={setNama}
          />
        </View>

        <Text style={styles.label}>EMAIL</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="mail-outline" size={18} color="#FFA500" style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="email@contoh.com"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>PASSWORD</Text>
        <View style={styles.fieldBox}>
          <Ionicons name="lock-closed-outline" size={18} color="#FFA500" style={styles.fieldIcon} />
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnDaftar, loading && { opacity: 0.6 }]}
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
            Sudah punya akun?{' '}
            <Text style={styles.loginBold}>Masuk sekarang</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFA500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFA500',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  headerSub: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#999',
    marginBottom: 22,
  },

  /* ── Fields ── */
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaa',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },

  /* ── Button ── */
  btnDaftar: {
    backgroundColor: '#FFA500',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  btnDaftarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  /* ── Divider ── */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    fontSize: 12,
    color: '#ccc',
  },

  /* ── Login link ── */
  loginRow: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: '#aaa',
  },
  loginBold: {
    color: '#FFA500',
    fontWeight: '700',
  },
});
