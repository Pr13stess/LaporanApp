import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const { data: { user } } = await supabase.auth.getUser();
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
    }

    const updateData = { email, data: { nama, foto: fotoUrl } };
    if (password) updateData.password = password;

    const { error: authError } = await supabase.auth.updateUser(updateData);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ nama, foto_profil: fotoUrl })
        .eq('id', user.id);
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>

        {/* Foto Profil */}
        <View style={styles.fotoContainer}>
          <TouchableOpacity onPress={pilihFoto}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.fotoProfil} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Ionicons name="person" size={48} color="#90CAF9" />
              </View>
            )}
            <View style={styles.fotoEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.fotoLabel}>Ganti Foto Profil</Text>
        </View>

        {/* Informasi Akun */}
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

        {/* Ganti Password */}
        <Text style={styles.sectionTitle}>Ganti Password</Text>

        <Text style={styles.label}>Password Baru</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            placeholder="Kosongkan jika tidak ingin ganti"
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
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 28,
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 4,
  },
  fotoLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 14,
    marginTop: 8,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 24,
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