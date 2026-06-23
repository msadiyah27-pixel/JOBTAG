# JOBTAG — Firebase Rules & Setup Guide

---

## 1. Firestore Security Rules

Salin rules berikut ke Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Attendance: hanya user yang bersangkutan bisa read/write ──
    match /attendance/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;

      // Allow create (dokumen baru belum punya resource.data)
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    // ── Reports: hanya user yang bersangkutan bisa read/write ──
    match /reports/{docId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    // ── Users: hanya user itu sendiri ──
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

---

## 2. Firebase Storage Rules

Salin rules berikut ke Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ── Foto laporan: hanya user yang bersangkutan ──
    match /reports/{userId}_{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024   // maks 5 MB
        && request.resource.contentType.matches('image/.*');
    }

    // Blokir semua akses lain
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Cara Mendapatkan Firebase Config

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Klik ikon ⚙️ → **Project Settings**
4. Scroll ke bagian **Your Apps** → klik ikon Web (</>) → daftarkan app
5. Copy nilai `firebaseConfig` ke `src/services/firebaseConfig.js`

---

## 4. Aktifkan Layanan Firebase

Di Firebase Console, aktifkan:

| Layanan | Lokasi |
|---|---|
| Authentication → Email/Password | Build → Authentication → Sign-in method |
| Firestore Database | Build → Firestore Database → Create database |
| Storage | Build → Storage → Get started |

---

## 5. Instalasi & Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan di Expo Go
npx expo start

# 3. Scan QR code dengan aplikasi Expo Go di HP
```

---

## 6. Struktur Firestore Collections

### Collection: `attendance`
Document ID: `{userId}_{YYYY-MM-DD}`

| Field | Type | Keterangan |
|---|---|---|
| userId | string | UID Firebase Auth |
| nama | string | Display name / email |
| email | string | Email user |
| tanggal | string | Format YYYY-MM-DD |
| checkIn | timestamp | Waktu Check In |
| checkOut | timestamp | Waktu Check Out (null jika belum) |
| latitude | number | Koordinat GPS |
| longitude | number | Koordinat GPS |
| status | string | "Check In" / "Check Out" |

---

### Collection: `reports`
Document ID: auto-generated

| Field | Type | Keterangan |
|---|---|---|
| userId | string | UID Firebase Auth |
| nama | string | Display name / email |
| email | string | Email user |
| aktivitas | string | Deskripsi pekerjaan |
| progress | number | Persentase 0–100 |
| kendala | string | Kendala pekerjaan |
| photoUrl | string | URL foto dari Storage (null jika tidak ada) |
| createdAt | timestamp | Waktu submit laporan |

---

### Collection: `users` (opsional — untuk data profil tambahan)
Document ID: `{userId}`

---

## 7. Cara Membuat User di Firebase Auth

Karena aplikasi ini tidak memiliki fitur Register, buat user manual:

1. Firebase Console → **Authentication** → **Users** → **Add user**
2. Isi email dan password
3. Gunakan credentials tersebut untuk login di aplikasi

---

## 8. Catatan untuk Expo Go

- Expo Go **mendukung penuh** `expo-image-picker` dan `expo-location`
- Untuk testing kamera/GPS di emulator Android, pastikan emulator mengizinkan permission kamera dan lokasi
- Untuk iOS Simulator, kamera tidak tersedia — gunakan galeri atau device fisik
