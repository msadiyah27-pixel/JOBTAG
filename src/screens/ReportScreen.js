import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { getDateKey } from '../utils/helpers';

export default function ReportScreen({ navigation }) {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataAbsen, setDataAbsen] = useState(null);
  const [dataLaporan, setDataLaporan] = useState(null);

  const muatDataLaporanHariIni = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const todayKey = getDateKey();
      
      // 1. Ambil Data Kehadiran / Absensi
      const absenRef = doc(db, 'attendance', `${user.uid}_${todayKey}`);
      const snapAbsen = await getDoc(absenRef);
      if (snapAbsen.exists()) {
        setDataAbsen(snapAbsen.data());
      } else {
        setDataAbsen(null);
      }

      // 2. Ambil Data Laporan Hasil Kerja
      const laporanRef = doc(db, 'reports', `${user.uid}_${todayKey}`);
      const snapLaporan = await getDoc(laporanRef);
      if (snapLaporan.exists()) {
        setDataLaporan(snapLaporan.data());
      } else {
        setDataLaporan(null);
      }
    } catch (error) {
      // Menangkap error permission agar tidak crash/keluar sistem secara paksa
      console.log('[checkStatusHariIni Protected Error]:', error.message);
      setDataAbsen(null);
      setDataLaporan(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    muatDataLaporanHariIni();
  }, [muatDataLaporanHariIni]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await muatDataLaporanHariIni();
    setRefreshing(false);
  }, [muatDataLaporanHariIni]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#be2929" />
        <Text style={styles.loadingText}>Memuat Ringkasan Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header Navigation */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={styles.exitButtonText}>🚪 Keluar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ringkasan Kerja</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#be2929" />}
      >
        {/* CARD 1: DETAIL ABSENSI */}
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>🔒 Status Absensi Kehadiran</Text>
          {dataAbsen ? (
            <View>
              {dataAbsen.fotoBase64 ? (
                <Image source={{ uri: dataAbsen.fotoBase64 }} style={styles.previewImageFrame} />
              ) : null}
              <Text style={styles.infoText}>Status: <Text style={styles.boldText}>{dataAbsen.status || 'Check In'}</Text></Text>
              <Text style={styles.infoText}>Koordinat Lat: {dataAbsen.latitude || '-'}</Text>
              <Text style={styles.infoText}>Koordinat Lon: {dataAbsen.longitude || '-'}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>Data absensi wajah & GPS belum terekam atau akses ditolak.</Text>
          )}
        </View>

        {/* CARD 2: DETAIL HASIL PEKERJAAN */}
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>📋 Hasil Pekerjaan Lapangan</Text>
          {dataLaporan ? (
            <View>
              {dataLaporan.fotoPekerjaan ? (
                <Image source={{ uri: dataLaporan.fotoPekerjaan }} style={styles.previewImageFrame} />
              ) : null}
              <Text style={styles.infoText}>Capaian Progres: <Text style={styles.boldText}>{dataLaporan.progres || 0}%</Text></Text>
              
              <Text style={styles.subCardTitle}>Deskripsi Kerja:</Text>
              <Text style={styles.descBlockText}>{dataLaporan.deskripsiKerja || '-'}</Text>
              
              <Text style={styles.subCardTitle}>🛠️ Peminjaman Alat:</Text>
              <Text style={styles.descBlockText}>{dataLaporan.namaAlat || 'Tidak ada peminjaman'}</Text>

              <Text style={styles.subCardTitle}>⚠️ Pengaduan / Kendala:</Text>
              <Text style={styles.descBlockText}>{dataLaporan.pengaduan || 'Tidak ada pengaduan'}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>Belum ada laporan kerja yang tersimpan untuk hari ini.</Text>
          )}
        </View>

        {/* TOMBOL AKSES SLIP GAJI (Rute: 'Salary') */}
        <TouchableOpacity style={styles.salaryActionBtn} onPress={() => navigation.navigate('Salary')}>
          <Text style={styles.salaryActionBtnText}>📄 LIHAT SLIP GAJI BULAN INI</Text>
        </TouchableOpacity>

        {/* TOMBOL SELESAI & KELUAR SISTEM UTAMA */}
        <TouchableOpacity style={styles.doneDashboardBtn} onPress={() => signOut(auth)}>
          <Text style={styles.doneDashboardBtnText}>SELESAI & KELUAR SISTEM</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 10, color: '#64748b', fontWeight: '600', fontSize: 14 },
  headerBar: { backgroundColor: '#ffffff', height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  exitButtonText: { color: '#be2929', fontWeight: '700', fontSize: 14 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  scrollWrapper: { padding: 20, alignItems: 'center', width: '100%' },
  contentCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 430, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 14, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 6 },
  previewImageFrame: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12, backgroundColor: '#e2e8f0' },
  infoText: { fontSize: 13, color: '#334155', marginBottom: 4 },
  boldText: { fontWeight: '700', color: '#be2929' },
  subCardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  descBlockText: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 13, color: '#475569', borderWidth: 1, borderColor: '#edf2f7', fontStyle: 'italic' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  salaryActionBtn: { backgroundColor: '#ffffff', width: '100%', maxWidth: 430, borderRadius: 8, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 12, borderWidth: 1.5, borderColor: '#0f172a' },
  salaryActionBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  doneDashboardBtn: { backgroundColor: '#be2929', width: '100%', maxWidth: 430, borderRadius: 8, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneDashboardBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 }
});