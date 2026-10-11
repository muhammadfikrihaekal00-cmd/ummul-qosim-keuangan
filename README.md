# SikadTPA - Sistem Pengelolaan Keuangan TPA / TPQ Ummul Qosim

Aplikasi web modern, terpadu, dan responsif untuk manajemen operasional dan keuangan Taman Pendidikan Al-Qur'an (TPA / TPQ).

---

## 🌟 Fitur Utama & Desain Eksklusif (Tidak Pasaran)

- 💎 **Luxury Bento Grid Fintech Dashboard**:
  - *Master Vault Card*: Kartu titanium kaca dengan saldo likuiditas total gabungan, bar alokasi persentase multi-kas dinamis (*Operasional, Tabungan, Infaq, Sarpras*), serta chip keamanan fintech EMV.
  - *Radar Syahriah (SPP) Circular Gauge*: Pengukur lingkaran SVG interaktif dengan animasi *stroke-dashoffset*, persentase capaian, serta rincian santri lunas, tunggakan, dan penerima beasiswa yatim.
  - *4 Kapsul Kas Unik*: Kas Operasional, Kas Tabungan Santri (*🔒 Dilindungi Syariah - Titipan Murni*), Kas Infaq/Sedekah (*Amal Jariyah*), dan Kas Sarpras (*Pengembangan Gedung*).
- 🔍 **Spotlight Command Palette (`Ctrl + K`) & Omnibar**:
  - Akses pencarian cepat santri, ustadz, transaksi, dan aksi keuangan hanya dengan menekan `Ctrl + K` atau klik bar pencarian mengambang.
- 🎴 **Dual-View SPP & Smart Segmented Filter**:
  - Mode **Visual Kartu Santri** (*Identitas avatar inisial, lencana jilid, kontak wali, dan tombol tindakan*) dan Mode **Tabel Data Pro**.
  - Bilah filter kapsul cerdas: *Semua Santri, Belum Lunas, Sudah Lunas, Beasiswa Yatim*.
- 📲 **Simulasi Pesan WhatsApp Interaktif**:
  - Jendela pop-up simulasi bubble chat WhatsApp asli sebelum mengirim pesan tagihan/kuitansi, lengkap dengan fitur salin teks dan peluncuran langsung ke WhatsApp Web / HP.
- 🧾 **Kwitansi Digital Thermal Slip**:
  - Desain struk kasir termal modern dengan tepi gerigi perforasi autentik, stempel air (*watermark verified*), dan kode batang.
- 🎨 **Multi-Theme Engine (5 Tema Mewah)**:
  - *Royal Sapphire* (default - Biru Safir & Gold)
  - *Persian Turquoise* (Toska Samarkand & Coral)
  - *Moroccan Terracotta* (Earthy Terakota & Pasir Gurun)
  - *Obsidian Midnight* (Dark Mode Futuristik Neon)
  - *Classic Emerald* (Zamrud Hijau Islami)
- 📖 **Buku Panduan Interaktif**: Panduan lengkap cara kustomisasi profil lembaga, santri, SPP, dan kode sumber langsung di aplikasi.
- 💾 **100% Offline-Ready & Backup JSON**: Menggunakan penyimpanan browser (*LocalStorage*) tanpa dependensi server berat.

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
