# SikadTPA - Sistem Pengelolaan Keuangan TPA / TPQ Ummul Qosim

Aplikasi web modern, terpadu, dan responsif untuk manajemen operasional dan keuangan Taman Pendidikan Al-Qur'an (TPA / TPQ).

---

## 🌟 Fitur Utama

- 📊 **Dashboard Kas Real-time**: Monitoring kas operasional, saldo tabungan santri, dan infaq/donasi secara terpisah dan akurat.
- 💳 **Manajemen SPP & Syahriah**: Pemantauan tagihan iuran bulanan santri, pencatatan pembayaran, dan riwayat pelunasan.
- 💰 **Tabungan Santri Terpadu**: Buku tabungan digital untuk setor, tarik saldo, serta mutasi per santri.
- 🕌 **Infaq & Wakaf**: Pencatatan dana sosial, pembangunan gedung, dan donasi jamaah.
- 🧑‍🏫 **Bisyarah / Honor Guru & Asatidz**: Pengelolaan honor ustadz dan ustadzah secara teratur.
- 🧾 **Kwitansi Digital WhatsApp**: Pembuatan bukti pembayaran otomatis yang siap dikirim langsung ke nomor WhatsApp wali santri.
- 📈 **Laporan Keuangan & Cetak**: Rekapitulasi kas masuk/keluar, ringkasan bulanan/tahunan, dan opsi cetak/export dokumen.
- 💾 **Offline-Ready**: Menggunakan penyimpanan lokal (*LocalStorage*) tanpa dependensi server yang rumit.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini berbasis HTML5, CSS3, dan Vanilla JavaScript murni, sehingga tidak membutuhkan instalasi server berat.

### Cara 1: Buka Langsung di Browser
Klik ganda file `index.html` pada browser favorit Anda (Google Chrome, Microsoft Edge, Firefox).

### Cara 2: Menggunakan PowerShell Server (Lokal)
Jalankan file `serve.ps1` via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Buka browser di [http://localhost:8080](http://localhost:8080).

---

## 📁 Struktur Berkas

```
├── css/
│   └── style.css       # Desain antarmuka & tema modern
├── js/
│   ├── app.js          # Logika aplikasi, navigasi, dan interaktivitas
│   └── data.js         # Data inisial dan struktur penyimpanan LocalStorage
├── index.html          # Halaman utama aplikasi
├── serve.ps1           # Skrip server lokal ringan
├── .gitignore          # Konfigurasi pengabaian berkas Git
└── README.md           # Dokumentasi proyek
```

---

## 👨‍💻 Kontributor
- **Muhammad Fikri Haekal** - [GitHub](https://github.com/muhammadfikrihaekal00-cmd)
