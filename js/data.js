/**
 * data.js - Data Model & Persistence Service untuk SikadTPA
 * Mengelola penyimpanan localStorage dengan dataset awal (seed data) yang realistis.
 */

const STORAGE_KEY = 'SIKAD_TPA_DATA_V2';

// Seed Data Awal yang Lengkap dan Realistis untuk RQ Ummul Qosim
const DEFAULT_DATA = {
  tpaInfo: {
    appName: "SikadTPA Keuangan",
    appLogo: "", // data URL Base64 atau kosong (default SVG)
    nama: "RQ Ummul Qosim",
    masjid: "-",
    alamat: "Perumahan Maros Regency, Blok F no. 3",
    kontak: "0812-3456-7890",
    email: "rq.ummulqosim@gmail.com",
    ketua: "Al Akh M. Fikri Haekal, C.LQ",
    bendahara: "Halisa Amelia",
    qrisUrl: "", // URL / Data URL Base64 gambar barcode QRIS asli
    qrisNmid: "ID1026091234567 • A01",
    qrisMerchant: "RQ UMMUL QOSIM",
    rekening: "MUAMALAT 8060019518 / BRI 022401017136537 / SULSELBAR 0102100000088413 ( Atas Nama : M Fikri Haekal )",
    securityPin: "060708"
  },
  // 4 Kelas Resmi RQ Ummul Qosim
  classes: [
    {
      id: 'K1',
      name: 'Kelas Dasar Ikhwan',
      shortName: 'Dasar Ikhwan',
      teacher: 'Ustadz Muhammad Rizqi',
      room: 'Ruang Shofa',
      schedule: 'Senin - Kamis (16:00 - 17:15 WITA)',
      color: 'emerald',
      icon: '📖'
    },
    {
      id: 'K2',
      name: 'Kelas Menengah Akhowat',
      shortName: 'Menengah Akhowat',
      teacher: 'Ustadzah Siti Fatimah',
      room: 'Ruang Marwah',
      schedule: 'Senin - Kamis (16:00 - 17:15 WITA)',
      color: 'royal',
      icon: '📗'
    },
    {
      id: 'K3',
      name: 'Kelas Menengah Ikhwan',
      shortName: 'Menengah Ikhwan',
      teacher: 'Ustadz Ahmad Fauzi',
      room: 'Aula Utama',
      schedule: 'Senin - Kamis (16:00 - 17:30 WITA)',
      color: 'persian',
      icon: '🕌'
    },
    {
      id: 'K4',
      name: 'Kelas Dasar Ikhwan & Akhowat',
      shortName: 'Dasar Gabungan',
      teacher: 'Ustadzah Nurul Khadijah',
      room: 'Serambi Utama',
      schedule: 'Senin - Kamis (16:00 - 17:30 WITA)',
      color: 'amber',
      icon: '⭐'
    }
  ],
  // 4 Kantong Kas Utama
  wallets: [
    { id: 'ops', name: 'Kas Operasional', desc: 'Dana dari SPP untuk biaya harian TPA', balance: 3450000, icon: 'wallet' },
    { id: 'tabungan', name: 'Kas Tabungan Santri', desc: 'Dana amanah titipan santri (tidak boleh terpakai ops)', balance: 4120000, icon: 'piggy' },
    { id: 'infaq', name: 'Kas Infaq & Sedekah', desc: 'Kotak amal Jumat & donasi sukarela', balance: 1850000, icon: 'heart' },
    { id: 'bangun', name: 'Kas Sarana & Pembangunan', desc: 'Khusus renovasi, meja Al-Quran & sarana', balance: 5200000, icon: 'building' }
  ],
  // Data Pengajar / Ustadz
  teachers: [
    { id: 'G-01', name: 'Ustadz Ahmad Fauzi', phone: '081298765431', role: 'Pengajar Kelas Menengah Ikhwan', baseSalary: 600000, sessions: 16, status: 'Aktif' },
    { id: 'G-02', name: 'Ustadzah Siti Fatimah', phone: '081387654322', role: 'Pengajar Kelas Menengah Akhowat', baseSalary: 550000, sessions: 14, status: 'Aktif' },
    { id: 'G-03', name: 'Ustadz Muhammad Rizqi', phone: '081976543213', role: 'Pengajar Kelas Dasar Ikhwan', baseSalary: 500000, sessions: 15, status: 'Aktif' },
    { id: 'G-04', name: 'Ustadzah Nurul Khadijah', phone: '085265432104', role: 'Pengajar Kelas Dasar Ikhwan & Akhowat', baseSalary: 600000, sessions: 16, status: 'Aktif' }
  ],
  // Data 36 Santri Resmi RQ Ummul Qosim
  students: [
    // --- KELAS DASAR IKHWAN (K1) ---
    { id: 'S-001', nis: '202601', name: 'Reyhan', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Reyhan', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-002', nis: '202602', name: 'Hafizh Regency', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Hafizh', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-003', nis: '202603', name: 'Rafa', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Rafa', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-004', nis: '202604', name: 'Fahri', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Fahri', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-005', nis: '202605', name: 'Ibad', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Ibad', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-006', nis: '202606', name: 'Sulaiman', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Sulaiman', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-007', nis: '202607', name: 'Fauzan', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Fauzan', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-008', nis: '202608', name: 'Koko', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Koko', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-009', nis: '202609', name: 'Rafasyah', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Rafasyah', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-010', nis: '202610', name: 'Hafizh Ramadhan', classId: 'K1', class: 'Kelas Dasar Ikhwan', parent: 'Wali Hafizh Ramadhan', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },

    // --- KELAS MENENGAH AKHOWAT (K2) ---
    { id: 'S-011', nis: '202611', name: 'Fadhiyah', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Fadhiyah', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-012', nis: '202612', name: 'Athifah', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Athifah', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-013', nis: '202613', name: 'Aura', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Aura', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-014', nis: '202614', name: 'Luthfia', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Luthfia', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-015', nis: '202615', name: 'Aulia', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Aulia', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-016', nis: '202616', name: 'Ayla', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Ayla', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-017', nis: '202617', name: 'Syifa', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Syifa', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-018', nis: '202618', name: 'Inayah', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Inayah', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-019', nis: '202619', name: 'Ruby', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Ruby', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-020', nis: '202620', name: 'Wafirah', classId: 'K2', class: 'Kelas Menengah Akhowat', parent: 'Wali Wafirah', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },

    // --- KELAS MENENGAH IKHWAN (K3) ---
    { id: 'S-021', nis: '202621', name: 'Aufar', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Aufar', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-022', nis: '202622', name: 'Marcel', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Marcel', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-023', nis: '202623', name: 'Ahmad', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Ahmad', phone: '', sppAmount: 100000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-024', nis: '202624', name: 'Dhaffa', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Dhaffa', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-025', nis: '202625', name: 'Shaka', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Shaka', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-026', nis: '202626', name: 'Iffath', classId: 'K3', class: 'Kelas Menengah Ikhwan', parent: 'Wali Iffath', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },

    // --- KELAS DASAR IKHWAN & AKHOWAT (K4) ---
    { id: 'S-027', nis: '202627', name: 'Ratu', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Ratu', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-028', nis: '202628', name: 'Queena', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Queena', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-029', nis: '202629', name: 'Keenan', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Keenan', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-030', nis: '202630', name: 'Indira', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Indira', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-031', nis: '202631', name: 'Harith', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Harith', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-032', nis: '202632', name: 'Khadijah', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Khadijah (Penerima Subsidi)', phone: '', sppAmount: 0, isScholarship: true, savingsBalance: 0 },
    { id: 'S-033', nis: '202633', name: 'Firas', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Firas', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-034', nis: '202634', name: 'Razky', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Razky', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-035', nis: '202635', name: 'Aqmar (Titi)', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Aqmar', phone: '', sppAmount: 150000, isScholarship: false, savingsBalance: 0 },
    { id: 'S-036', nis: '202636', name: 'Adibah', classId: 'K4', class: 'Kelas Dasar Ikhwan & Akhowat', parent: 'Wali Adibah', phone: '', sppAmount: 200000, isScholarship: false, savingsBalance: 0 }
  ],
  // Catatan SPP Bulanan (Otomatis santri subsidi terdata lunas Rp 0)
  sppRecords: [
    { id: 'SPP-2610-032', studentId: 'S-032', month: '2026-10', amount: 0, paidDate: '2026-10-01', status: 'Lunas', method: 'Beasiswa / Subsidi', receiptNo: 'KW-2610-SUB01' }
  ],
  // Riwayat Tabungan Santri
  savingsTransactions: [],
  // Mutasi Kas Awal
  transactions: [
    { id: 'TX-101', date: '2026-10-01', type: 'in', walletId: 'bangun', category: 'Donasi Pembangunan', amount: 1000000, desc: 'Donasi Muhsinin untuk perbaikan fasilitas TPA', ref: 'DN-01' },
    { id: 'TX-102', date: '2026-10-04', type: 'in', walletId: 'infaq', category: 'Kotak Infaq Santri', amount: 245000, desc: 'Infaq Jumat santri pekan 1 Oktober', ref: 'INF-01' }
  ]
};

// In-memory fallback untuk browser dengan mode privasi ketat / sandbox
const _memStorage = {};
function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return _memStorage[key] || null;
  }
}
function safeStorageSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    _memStorage[key] = val;
  }
}
function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    delete _memStorage[key];
  }
}

// Modul Akses Data (Repository Pattern)
class TPADatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    let raw = null;
    try {
      raw = safeStorageGet(STORAGE_KEY);
      if (!raw) {
        // Cek migrasi dari versi V1 sebelumnya jika ada custom logo atau settingan
        const oldV1 = safeStorageGet('SIKAD_TPA_DATA_V1');
        if (oldV1) {
          try {
            const oldParsed = JSON.parse(oldV1);
            const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
            if (Array.isArray(oldParsed.wallets) && oldParsed.wallets.length > 0) fresh.wallets = oldParsed.wallets;
            if (Array.isArray(oldParsed.transactions) && oldParsed.transactions.length > 0) fresh.transactions = oldParsed.transactions;
            if (oldParsed.tpaInfo && oldParsed.tpaInfo.qrisUrl) fresh.tpaInfo.qrisUrl = oldParsed.tpaInfo.qrisUrl;
            this.save(fresh);
            return fresh;
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn("Storage access notice:", e);
    }

    if (!raw) {
      this.save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.tpaInfo) parsed.tpaInfo = {};
      parsed.tpaInfo = { ...DEFAULT_DATA.tpaInfo, ...parsed.tpaInfo };
      if (!Array.isArray(parsed.students)) parsed.students = JSON.parse(JSON.stringify(DEFAULT_DATA.students));
      if (!Array.isArray(parsed.sppRecords)) parsed.sppRecords = JSON.parse(JSON.stringify(DEFAULT_DATA.sppRecords));
      if (!Array.isArray(parsed.wallets)) parsed.wallets = JSON.parse(JSON.stringify(DEFAULT_DATA.wallets));
      if (!Array.isArray(parsed.teachers)) parsed.teachers = JSON.parse(JSON.stringify(DEFAULT_DATA.teachers));
      if (!Array.isArray(parsed.transactions)) parsed.transactions = JSON.parse(JSON.stringify(DEFAULT_DATA.transactions));
      if (!Array.isArray(parsed.savingsTransactions)) parsed.savingsTransactions = JSON.parse(JSON.stringify(DEFAULT_DATA.savingsTransactions));

      // Deteksi jika masih memuat data demo lama (Zaki Pratama) atau kurang dari 36 santri, otomatis perbarui ke 36 santri asli
      const hasOldDemoData = parsed.students.some(s => s.name === 'Muhammad Zaki Pratama');
      if (hasOldDemoData || parsed.students.length < 30) {
        parsed.students = JSON.parse(JSON.stringify(DEFAULT_DATA.students));
        parsed.classes = JSON.parse(JSON.stringify(DEFAULT_DATA.classes));
        parsed.teachers = JSON.parse(JSON.stringify(DEFAULT_DATA.teachers));
        parsed.tpaInfo = { ...DEFAULT_DATA.tpaInfo, ...parsed.tpaInfo };
        parsed.tpaInfo.ketua = DEFAULT_DATA.tpaInfo.ketua;
        parsed.tpaInfo.bendahara = DEFAULT_DATA.tpaInfo.bendahara;
        parsed.tpaInfo.alamat = DEFAULT_DATA.tpaInfo.alamat;
        parsed.tpaInfo.rekening = DEFAULT_DATA.tpaInfo.rekening;
        parsed.sppRecords = JSON.parse(JSON.stringify(DEFAULT_DATA.sppRecords));
        this.save(parsed);
      }

      // 4 Kelas Resmi RQ Ummul Qosim
      if (!Array.isArray(parsed.classes) || parsed.classes.length === 0) {
        parsed.classes = JSON.parse(JSON.stringify(DEFAULT_DATA.classes));
      } else {
        DEFAULT_DATA.classes.forEach(defCls => {
          const existing = parsed.classes.find(c => c.id === defCls.id);
          if (!existing) {
            parsed.classes.push({ ...defCls });
          } else {
            if (!existing.shortName) existing.shortName = defCls.shortName;
            if (!existing.icon) existing.icon = defCls.icon;
            if (!existing.room) existing.room = defCls.room;
            if (!existing.schedule) existing.schedule = defCls.schedule;
            if (!existing.teacher) existing.teacher = defCls.teacher;
            if (!existing.color) existing.color = defCls.color;
          }
        });
      }

      // Sinkronisasi kelas santri dengan daftar kelas aktif
      parsed.students.forEach(s => {
        if (!s.classId) {
          const matched = parsed.classes.find(c => c.name === s.class || c.shortName === s.class);
          if (matched) {
            s.classId = matched.id;
          } else if (s.class) {
            const c = s.class.toLowerCase();
            if (c.includes('dasar') && c.includes('gabungan') || c.includes('ikwan & akhowat') || c.includes('k4')) s.classId = 'K4';
            else if (c.includes('menengah') && c.includes('ikhwan') || c.includes('k3')) s.classId = 'K3';
            else if (c.includes('menengah') && c.includes('akhowat') || c.includes('k2')) s.classId = 'K2';
            else s.classId = 'K1';
          } else {
            s.classId = 'K1';
          }
        }
        
        // Pastikan nama kelas santri konsisten
        const targetCls = parsed.classes.find(c => c.id === s.classId);
        if (targetCls && !s.class) {
          s.class = targetCls.name;
        }
      });

      return parsed;
    } catch (e) {
      console.error("Gagal membaca database lokal, mereset ke default:", e);
      this.save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  save(dataToSave = null) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      safeStorageSet(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Gagal menyimpan ke penyimpanan lokal:", e);
    }
  }

  resetToDefault() {
    try {
      safeStorageRemove(STORAGE_KEY);
    } catch (e) {}
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
    return this.data;
  }

  // --- 4 Kelas Resmi RQ Ummul Qosim ---
  getClasses() {
    if (!this.data.classes || !Array.isArray(this.data.classes)) {
      this.data.classes = JSON.parse(JSON.stringify(DEFAULT_DATA.classes));
      this.save();
    }
    return this.data.classes;
  }

  getClass(id) {
    return this.getClasses().find(c => c.id === id) || null;
  }

  updateClass(classId, updateData) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === classId);
    if (idx === -1) return null;

    const oldName = classes[idx].name;
    const oldShort = classes[idx].shortName;

    classes[idx] = { ...classes[idx], ...updateData };

    // Update seluruh santri yang berada di kelas ini secara otomatis
    if (updateData.name && updateData.name !== oldName) {
      if (Array.isArray(this.data.students)) {
        this.data.students.forEach(s => {
          if (s.classId === classId || s.class === oldName || s.class === oldShort) {
            s.class = updateData.name;
            s.classId = classId;
          }
        });
      }
    }

    this.save();
    return classes[idx];
  }

  // --- Wallets (Kas) ---
  getWallets() {
    return this.data.wallets;
  }

  getWallet(id) {
    return this.data.wallets.find(w => w.id === id);
  }

  updateWalletBalance(walletId, amountDelta) {
    const wallet = this.getWallet(walletId);
    if (wallet) {
      wallet.balance += amountDelta;
      this.save();
    }
  }

  // --- Santri & SPP ---
  getStudents() {
    return this.data.students;
  }

  getStudent(id) {
    return this.data.students.find(s => s.id === id);
  }

  addStudent(student) {
    if (!this.data.students) this.data.students = [];
    const students = this.data.students;

    // Hitung nomor sequential tertinggi untuk ID unik tanpa risiko duplikasi
    let maxIdNum = 0;
    students.forEach(s => {
      const match = String(s.id || '').match(/S-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
    });
    student.id = 'S-' + String(maxIdNum + 1).padStart(3, '0');

    // Generate NIS jika kosong
    if (!student.nis || String(student.nis).trim() === '') {
      const curYear = new Date().getFullYear();
      let maxNisNum = 0;
      students.forEach(s => {
        const nisStr = String(s.nis || '');
        if (nisStr.startsWith(String(curYear))) {
          const suffix = parseInt(nisStr.slice(4), 10);
          if (!isNaN(suffix) && suffix > maxNisNum) maxNisNum = suffix;
        }
      });
      student.nis = `${curYear}${String(maxNisNum + 1).padStart(2, '0')}`;
    }

    student.savingsBalance = Number(student.savingsBalance || 0);
    student.sppAmount = Number(student.sppAmount !== undefined ? student.sppAmount : 50000);
    student.isScholarship = Boolean(student.isScholarship);
    if (student.isScholarship) {
      student.sppAmount = 0;
    }

    if (!student.classId) {
      const matched = this.getClasses().find(c => c.name === student.class || c.shortName === student.class || c.id === student.class);
      student.classId = matched ? matched.id : 'K1';
    }

    this.data.students.push(student);
    this.save();
    return student;
  }

  updateStudent(studentId, updateData) {
    const idx = this.data.students.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      this.data.students[idx] = { ...this.data.students[idx], ...updateData };
      this.save();
      return this.data.students[idx];
    }
    return null;
  }

  deleteStudent(studentId) {
    this.data.students = this.data.students.filter(s => s.id !== studentId);
    this.save();
  }

  // Cek status SPP santri pada bulan tertentu (format 'YYYY-MM')
  getSppStatus(studentId, monthStr) {
    const student = this.getStudent(studentId);
    if (!student) return null;
    if (student.isScholarship) {
      return { isPaid: true, record: null, note: 'Beasiswa Yatim/Dhuafa (Bebas Biaya)' };
    }
    const record = this.data.sppRecords.find(r => r.studentId === studentId && r.month === monthStr);
    return {
      isPaid: Boolean(record),
      record: record || null
    };
  }

  paySpp(studentId, monthStr, amount, method = 'Tunai', customReceiptNo = null, proofImage = null) {
    const student = this.getStudent(studentId);
    if (!student) return null;

    const receiptNo = customReceiptNo || `KW-${monthStr.replace('-', '')}-${String(this.data.sppRecords.length + 1).padStart(3, '0')}`;
    const newRecord = {
      id: 'SPP-' + Date.now().toString().slice(-6),
      studentId: studentId,
      month: monthStr,
      amount: amount,
      paidDate: new Date().toISOString().split('T')[0],
      status: 'Lunas',
      method: method,
      receiptNo: receiptNo,
      proofImage: proofImage || null
    };

    this.data.sppRecords.push(newRecord);

    // Otomatis masukkan ke Kas Operasional
    this.addTransaction({
      date: newRecord.paidDate,
      type: 'in',
      walletId: 'ops',
      category: 'SPP Santri',
      amount: amount,
      desc: `SPP Bulan ${monthStr} a.n. ${student.name} (${student.class})`,
      ref: receiptNo
    });

    this.save();
    return newRecord;
  }

  deleteSppRecord(recordId) {
    const idx = this.data.sppRecords.findIndex(r => r.id === recordId);
    if (idx === -1) return false;
    const rec = this.data.sppRecords[idx];
    this.data.sppRecords.splice(idx, 1);

    // Kembalikan saldo kas operasional & hapus riwayat transaksi kas terkait
    const txIdx = this.data.transactions.findIndex(t => t.ref === rec.receiptNo || t.ref === rec.id);
    if (txIdx !== -1) {
      const tx = this.data.transactions[txIdx];
      this.updateWalletBalance(tx.walletId, -tx.amount);
      this.data.transactions.splice(txIdx, 1);
    }
    this.save();
    return true;
  }


  // --- Tabungan Santri ---
  addSavingsTransaction(studentId, type, amount, note = '') {
    const student = this.getStudent(studentId);
    if (!student) throw new Error("Santri tidak ditemukan");

    if (type === 'Tarik' && student.savingsBalance < amount) {
      throw new Error(`Saldo tabungan santri tidak mencukupi! (Saldo: Rp ${student.savingsBalance.toLocaleString('id-ID')})`);
    }

    const delta = type === 'Setor' ? amount : -amount;
    student.savingsBalance += delta;

    // Catat mutasi tabungan
    const tx = {
      id: 'SAV-' + Date.now().toString().slice(-6),
      date: new Date().toISOString().split('T')[0],
      studentId: studentId,
      type: type,
      amount: amount,
      note: note || (type === 'Setor' ? 'Setoran tabungan' : 'Penarikan tabungan')
    };
    this.data.savingsTransactions.unshift(tx);

    // Sinkronkan ke Kas Tabungan Santri
    this.updateWalletBalance('tabungan', delta);

    this.save();
    return tx;
  }

  getSavingsTransactions(studentId = null) {
    if (!studentId) return this.data.savingsTransactions;
    return this.data.savingsTransactions.filter(t => t.studentId === studentId);
  }

  // --- Transaksi Umum (Kas Masuk & Keluar) ---
  getTransactions(filter = {}) {
    let list = [...this.data.transactions];

    if (filter.walletId) {
      list = list.filter(t => t.walletId === filter.walletId);
    }
    if (filter.type) {
      list = list.filter(t => t.type === filter.type);
    }
    if (filter.category) {
      list = list.filter(t => t.category.toLowerCase().includes(filter.category.toLowerCase()));
    }
    if (filter.startDate) {
      list = list.filter(t => t.date >= filter.startDate);
    }
    if (filter.endDate) {
      list = list.filter(t => t.date <= filter.endDate);
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }

  addTransaction({ date, type, walletId, category, amount, desc, ref }) {
    const tx = {
      id: 'TX-' + Date.now().toString().slice(-6),
      date: date || new Date().toISOString().split('T')[0],
      type, // 'in' or 'out'
      walletId,
      category,
      amount: Number(amount),
      desc: desc || '',
      ref: ref || '-'
    };

    this.data.transactions.unshift(tx);

    // Update wallet balance
    const delta = type === 'in' ? tx.amount : -tx.amount;
    this.updateWalletBalance(walletId, delta);

    this.save();
    return tx;
  }

  deleteTransaction(id) {
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const tx = this.data.transactions[idx];
      const delta = tx.type === 'in' ? -tx.amount : tx.amount;
      this.updateWalletBalance(tx.walletId, delta);
      this.data.transactions.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Ustadz / Guru & Bisyarah ---
  getTeachers() {
    return this.data.teachers;
  }

  addTeacher(teacher) {
    if (!this.data.teachers) this.data.teachers = [];
    let maxIdNum = 0;
    this.data.teachers.forEach(t => {
      const match = String(t.id || '').match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
    });
    teacher.id = 'G-' + String(maxIdNum + 1).padStart(2, '0');
    teacher.baseSalary = Number(teacher.baseSalary || 750000);
    teacher.sessions = Number(teacher.sessions || 16);
    this.data.teachers.push(teacher);
    this.save();
    return teacher;
  }

  deleteTeacher(id) {
    if (!this.data.teachers) return;
    this.data.teachers = this.data.teachers.filter(t => t.id !== id);
    this.save();
  }

  updateTeacher(id, updateData) {
    const t = this.data.teachers.find(item => item.id === id);
    if (t) {
      const oldName = t.name;
      Object.assign(t, updateData);

      // Jika nama ustadz berubah, sinkronkan ke kelas yang diampu
      if (updateData.name && updateData.name !== oldName && Array.isArray(this.data.classes)) {
        this.data.classes.forEach(c => {
          if (c.teacher === oldName) {
            c.teacher = updateData.name;
          }
        });
      }

      this.save();
    }
    return t;
  }

  // Bayar Bisyarah Ustadz
  payBisyarah(teacherId, monthStr, amount, note = '') {
    const teacher = this.data.teachers.find(t => t.id === teacherId);
    if (!teacher) throw new Error("Data ustadz tidak ditemukan");

    const refNo = `BSY-${monthStr.replace('-', '')}-${teacher.id}`;
    const tx = this.addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'out',
      walletId: 'ops',
      category: 'Bisyarah Guru',
      amount: amount,
      desc: `Bisyarah ${teacher.name} periode ${monthStr}. ${note}`,
      ref: refNo
    });

    return { tx, refNo, teacher };
  }

  // --- Profil TPA ---
  getTPAInfo() {
    return this.data.tpaInfo;
  }

  updateTPAInfo(newInfo) {
    this.data.tpaInfo = { ...this.data.tpaInfo, ...newInfo };
    this.save();
    return this.data.tpaInfo;
  }

  // --- Keamanan & PIN Bendahara ---
  getSecurityPin() {
    if (!this.data.tpaInfo) this.data.tpaInfo = {};
    if (!this.data.tpaInfo.securityPin) {
      this.data.tpaInfo.securityPin = '060708';
      this.save();
    }
    return this.data.tpaInfo.securityPin;
  }

  updateSecurityPin(newPin) {
    if (!this.data.tpaInfo) this.data.tpaInfo = {};
    this.data.tpaInfo.securityPin = String(newPin);
    this.save();
    return this.data.tpaInfo.securityPin;
  }
}

// Global instance
window.db = new TPADatabase();
var db = window.db;

