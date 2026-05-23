import { supabase } from '../../lib/supabase'; // tambahkan import ini di atas

const kirimLaporan = async () => {
  if (!judul || !tanggal || !detail) {
    Alert.alert('Gagal', 'Semua field harus diisi!');
    return;
  }

  const { error } = await supabase.from('laporan').insert({
    judul,
    tanggal,
    deskripsi: detail,
    nama: 'King', // nanti bisa diganti dengan nama user login
    status: 'pending',
    foto: null,
  });

  if (error) {
    Alert.alert('Error', 'Gagal mengirim laporan: ' + error.message);
  } else {
    Alert.alert('Berhasil!', 'Laporan kamu berhasil dikirim!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  }
};