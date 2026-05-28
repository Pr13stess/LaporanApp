import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const TAGS = ['Jalan Rusak', 'Pohon Tumbang', 'Banjir'];

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Gagal', 'Email dan password harus diisi!');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Gagal Login', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.iconRing}>
          <Ionicons name="location" size={32} color="#fff" />
        </View>
        <Text style={styles.appName}>LaporanApp</Text>
        <Text style={styles.appSub}>Infrastruktur Kita, Tanggung Jawab Kita</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Selamat datang!</Text>
        <Text style={styles.cardSub}>Masuk untuk mulai melaporkan</Text>

        <View style={styles.tagRow}>
          {TAGS.map((t) => (
            <View key={t} style={styles.tag}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
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

        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Lupa password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnLogin, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnLoginText}>{loading ? 'Loading...' : 'Masuk Sekarang'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerRow}>
          <Text style={styles.registerText}>
            Belum punya akun? <Text style={styles.registerBold}>Daftar sekarang</Text>
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
  appSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },

  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1565C0', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 20 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EAF4FB', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFA500' },
  tagText: { fontSize: 11, fontWeight: '600', color: '#1565C0' },

  label: { fontSize: 11, fontWeight: '600', color: '#555', letterSpacing: 0.6, marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C9E5F5',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#F4FAFD', marginBottom: 16,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 14, color: '#333' },

  forgotWrap: { alignItems: 'flex-end', marginTop: -6, marginBottom: 20 },
  forgotText: { fontSize: 12, color: '#1565C0', fontWeight: '500' },

  btnLogin: {
    backgroundColor: '#FFA500', borderRadius: 20,
    paddingVertical: 14, alignItems: 'center', marginBottom: 18,
  },
  btnLoginText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { fontSize: 12, color: '#BBB' },

  registerRow: { alignItems: 'center' },
  registerText: { fontSize: 13, color: '#888' },
  registerBold: { color: '#1565C0', fontWeight: '700' },
});