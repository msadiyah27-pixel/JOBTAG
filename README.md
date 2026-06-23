# JOBTAG
# Job Tracking & Reporting System

<p align="center">
  <img src="https://img.shields.io/badge/React__Native-Expo__52.0.0-4630EB?style=for-the-badge&logo=react" alt="React Native Expo">
  <img src="https://img.shields.io/badge/Firebase-v11.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Axios-v1.18.1-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios">
</p>

> Laporan Ujian Praktikum Mobile Computing — Semester Genap 2025/2026

---

## 1. Identitas Tim & Pembagian Tugas (Skenario B)

Dokumentasi ini disusun oleh Kelompok Tim Skenario B (2 Orang) dengan rincian peran, tanggung jawab, dan pembagian tugas riil sebagai berikut:

| No | Nama Anggota | NRP | Peran | Tanggung Jawab & Detail Tugas |
|----|--------------|-----|-------|-------------------------------|
| 1 | Muarofatussa'diyah | 0923040067 | **Frontend & Axios Specialist** | Merancang seluruh UI/UX aplikasi (`LoginScreen`, `DashboardScreen`, navigasi) dan bertanggung jawab penuh atas integrasi Axios untuk berkomunikasi dengan API eksternal. |
| 2 | M. Zazul Romadhoni | 0923040059 | **Backend, State & Firebase Specialist** | Mengelola logika state aplikasi (penyimpanan data sementara di lokal) dan bertanggung jawab penuh atas seluruh integrasi layanan Firebase. |

### Rincian Kontribusi (Bukti Git Commit)
* **Muarofatussa'diyah:** Implementasi tata letak visual antarmuka, sistem navigasi halaman dengan React Navigation, penanganan modul kamera perangkat dan pencatatan GPS lokal, serta mekanisme request asinkron berita K3 via Axios.
* **M. Zazul Romadhoni:** Inisialisasi berkas `firebaseConfig.js`, konfigurasi Firebase Authentication (Login/Register), manajemen persitensi sesi, perancangan skema NoSQL database Cloud Firestore, dan implementasi security rules.

---

## 2. Deskripsi Aplikasi

**JOBTAG** adalah sistem pelacakan dan pelaporan kerja digital yang dirancang khusus untuk pekerja lapangan. Aplikasi ini mengintegrasikan fungsi utilitas internal perangkat dengan arsitektur jaringan cloud untuk memudahkan manajemen data performa kerja secara transparan dan efisien. 

Melalui aplikasi mobile ini, pekerja dapat melakukan absensi tervalidasi berbasis jepretan kamera wajah dan koordinat lokasi GPS secara presisi, mengirimkan laporan progres harian langsung dari lapangan, memantau slip gaji elektronik secara berkala, serta menerima pembaruan edukasi Keselamatan dan Kesehatan Kerja (K3).

### Tech Stack Utama:
* **Framework:** React Native (Expo SDK ~52.0.0)
* **Backend-as-a-Service (BaaS):** Firebase v11 (Authentication & Cloud Firestore)
* **HTTP Client:** Axios v1.18.1
* **Hardware Access:** `expo-image-picker` (Kamera) & `expo-location` (GPS Geolocation)
* **State & Storage:** `@react-native-async-storage/async-storage`

---

## 3. Daftar API yang Digunakan

Aplikasi JOBTAG menggunakan dua jenis integrasi layanan jaringan eksternal:

| Nama API / Layanan | Endpoint / Metode | Kegunaan |
|--------------------|-------------------|----------|
| **HTTPBin** | `GET https://httpbin.org/get?refresh={timestamp}` | Berfungsi sebagai API *trigger* untuk fitur pembaruan data modul informasi K3 sekaligus sebagai bukti keberhasilan HTTP request menggunakan pustaka **Axios**. |
| **Firebase Auth** | Firebase SDK (`auth`) | Mengelola sistem registrasi akun pekerja baru, validasi hak akses masuk, serta mempertahankan sesi pengguna aktif (*session persistence*). |
| **Cloud Firestore**| Firebase SDK (`firestore`) | Database NoSQL utama untuk operasi CRUD data profil user (`users`), log presensi harian (`attendance`), dan laporan kerja lapangan (`reports`). |

---

## 4. Daftar 3 Fitur Utama (Alur Demo Penilaian)

Sesuai kriteria penilaian praktikum, berikut adalah 3 fitur utama yang diimplementasikan dan siap didemokan alur kodenya:

### Fitur 1 — Autentikasi Pengguna (Login & Register)
* **File Source:** `src/screens/LoginScreen.js`
* **Alur Demo:** Fitur pendaftaran akun menggunakan fungsi `createUserWithEmailAndPassword`. Informasi tambahan (Nama dan Jabatan) disimpan ke Firestore koleksi `users/{uid}` via fungsi `setDoc`. Setelah proses masuk tervalidasi via `signInWithEmailAndPassword`, sesi dikunci otomatis menggunakan listener `onAuthStateChanged` agar user langsung diarahkan ke Dashboard saat aplikasi dibuka kembali.
* **Penanggung Jawab:** M. Zazul Romadhoni

### Fitur 2 — Absensi & Laporan Kerja Harian (Kamera, GPS, & Axios)
* **File Source:** `src/screens/DashboardScreen.js`
* **Alur Demo:** Pekerja melakukan presensi dengan mengambil foto selfie lewat `expo-image-picker` (dikonversi ke format string Base64) dan mengunci titik koordinat spasial lewat `expo-location`. Data presensi dan form laporan kerja dikirim ke koleksi Firestore secara real-time. Di saat bersamaan, pustaka **Axios** mengeksekusi request GET ke `httpbin.org` untuk mentrigger visualisasi rotasi tips keselamatan kerja K3.
* **Penanggung Jawab:** Muarofatussa'diyah

### Fitur 3 — Ringkasan Kerja & Slip Gaji Elektronik
* **File Source:** `src/screens/ReportScreen.js` & `src/screens/SalaryScreen.js`
* **Alur Demo:** Aplikasi mengeksekusi fungsi pembacaan data `getDoc` dari Firestore dengan skema ID dokumen unik gabungan `{uid}_{tanggal}`. Halaman ini menyajikan rekap data kehadiran, koordinat lokasi, dan pengaduan kendala secara terperinci. Sistem juga secara otomatis mengkalkulasikan variabel komponen finansial (gaji pokok, tunjangan, dan potongan BPJS) berdasarkan parameter jabatan pekerja untuk mencetak slip gaji elektronik secara dinamis.
* **Penanggung Jawab:** Muarofatussa'diyah & M. Zazul Romadhoni

---

## 5. Struktur Arsitektur Kode Proyek

```text
jobtag-app/
├── App.js                        # Root file dan pintu gerbang utama aplikasi
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js       # Konfigurasi React Navigation & Auth Listener
│   ├── screens/
│   │   ├── LoginScreen.js        # Fitur 1: Antarmuka Autentikasi & Registrasi
│   │   ├── DashboardScreen.js    # Fitur 2: Layar Form Absensi Kamera, GPS, & Axios
│   │   ├── ReportScreen.js       # Fitur 3: Antarmuka Ringkasan Riwayat Harian
│   │   └── SalaryScreen.js       # Fitur 3: Tampilan Slip Gaji Berbasis Jabatan
│   ├── services/
│   │   └── firebaseConfig.js     # Berkas inisialisasi kredensial SDK Firebase
│   ├── components/
│   │   ├── LoadingOverlay.js     # Komponen reusable indikator loading UI
│   │   └── StatusBadge.js        # Komponen reusable visual penanda status kerja
│   └── utils/
│       ├── helpers.js            # Fungsi pembantu format tanggal & mata uang IDR
│       └── theme.js              # Pola warna global aplikasi bertema K3
├── package.json                  # Konfigurasi dependensi library pihak ketiga
└── FIREBASE_SETUP.md             # Catatan panduan konfigurasi environment database
