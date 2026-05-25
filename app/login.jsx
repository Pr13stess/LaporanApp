import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

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
        <View style={styles.header}>
        <Ionicons name="location" size={48} color="#fff" />
        <Text style={styles.appName}>LaporanApp</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#aaa"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnKirim, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnKirimText}>{loading ? 'Loading...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>Belum punya akun? <Text style={styles.registerTextBold}>Daftar</Text></Text>
        </TouchableOpacity>
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
header: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 60,
  paddingBottom: 20,
  gap: 8,
},
appName: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 24,
  letterSpacing: 1,
},
  form: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 28,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  btnKirim: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnKirimText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#888',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
});