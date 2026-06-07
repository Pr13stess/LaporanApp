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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="megaphone" size={20} color="#1a1a1a" />
          </View>
          <Text style={styles.logoText}>MariLapor!</Text>
        </View>
        <Text style={styles.headerTitle}>Selamat Datang!</Text>
        <Text style={styles.headerSub}>Infrastruktur Kita, Tanggung Jawab Kita</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Masuk</Text>
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

        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Lupa password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnLogin, loading && { opacity: 0.6 }]}
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
            Belum punya akun?{' '}
            <Text style={styles.registerBold}>Daftar sekarang</Text>
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
    marginBottom: 16,
  },

  /* ── Tags ── */
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFA500',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cc7700',
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
    marginBottom: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },

  /* ── Forgot ── */
  forgotWrap: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: '600',
  },

  /* ── Button ── */
  btnLogin: {
    backgroundColor: '#FFA500',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnLoginText: {
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

  /* ── Register link ── */
  registerRow: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    color: '#aaa',
  },
  registerBold: {
    color: '#FFA500',
    fontWeight: '700',
  },
});
