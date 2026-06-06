import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email);
      setNama(user.user_metadata?.nama || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('foto_profil')
        .eq('id', user.id)
        .single();

      setFoto(profile?.foto_profil || user.user_metadata?.foto || null);
    }
  };

  const pilihFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleSimpan = async () => {
    setLoading(true);
    let fotoUrl = foto;

    if (foto && foto.startsWith('file://')) {
      const ext = foto.split('.').pop();
      const fileName = `avatar_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: foto, name: fileName, type: `image/${ext}` });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData);

      if (uploadError) {
        Alert.alert('Gagal', 'Upload foto gagal: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
      
      if (!fotoUrl || fotoUrl.includes('file://')) {
        Alert.alert('Gagal', 'URL foto tidak valid');
        setLoading(false);
        return;
      }
    }

    const updateData = { email, data: { nama, foto: fotoUrl } };
    if (password) updateData.password = password;

    const { error: authError } = await supabase.auth.updateUser(updateData);

     const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            nama,
            foto_profil: fotoUrl,
          }, { onConflict: 'id' });
      }

    setLoading(false);

    if (authError) {
      Alert.alert('Gagal', authError.message);
    } else {
      Alert.alert('Berhasil!', 'Profil berhasil diperbarui!');
      setPassword('');
      setFoto(fotoUrl);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto Profil */}
        <View style={styles.fotoContainer}>
          <TouchableOpacity onPress={pilihFoto} activeOpacity={0.85}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.fotoProfil} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Ionicons name="person" size={46} color="#bbb" />
              </View>
            )}
            <View style={styles.fotoEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.fotoLabel}>Ganti Foto Profil</Text>
        </View>

        {/* Informasi Akun */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>

          <Text style={styles.label}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama Lengkap"
            placeholderTextColor="#bbb"
            value={nama}
            onChangeText={setNama}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="Email"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Ganti Password */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ganti Password</Text>

          <Text style={styles.label}>Password Baru</Text>
          <View style={[styles.inputRow, { marginBottom: 0 }]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, padding: 0 }]}
              placeholder="Kosongkan jika tidak ingin ganti"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#bbb"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Simpan */}
        <TouchableOpacity
          style={[styles.btnSimpan, loading && { opacity: 0.7 }]}
          onPress={handleSimpan}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.btnSimpanText}>Menyimpan...</Text>
          ) : (
            <View style={styles.btnInner}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnSimpanText}>Simpan Perubahan</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.btnLogout}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.btnLogoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ORANGE = '#e49400';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.97)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },

  // Form wrapper
  form: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    minHeight: '100%',
  },

  // Foto
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  fotoProfil: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  fotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: ORANGE,
    borderRadius: 12,
    padding: 5,
  },
  fotoLabel: {
    marginTop: 8,
    fontSize: 13,
    color: ORANGE,
    fontWeight: '600',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: ORANGE,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    padding: 11,
    marginBottom: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
    backgroundColor: '#FAFAFA',
  },

  // Buttons
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSimpan: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  btnSimpanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnLogout: {
    backgroundColor: '#E53935',
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnLogoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
