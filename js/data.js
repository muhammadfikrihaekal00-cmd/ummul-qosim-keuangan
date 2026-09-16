/**
 * data.js - Data Model & Persistence Service untuk SikadTPA
 * Mengelola penyimpanan localStorage dengan dataset awal (seed data) yang realistis.
 */

const STORAGE_KEY = 'SIKAD_TPA_DATA_V1';

// Seed Data Awal yang Lengkap dan Realistis
const DEFAULT_DATA = {
  tpaInfo: {
    nama: "TPA Al-Hidayah",
    masjid: "Masjid Jami' Al-Hidayah",
    alamat: "Jl. Melati No. 45, Kompleks Griya Asri, Kota Bandung",
    kontak: "0812-3456-7890",
    email: "tpa.alhidayah@gmail.com",
    ketua: "Ustadz H. Abdul Malik, S.Pd.I",
    bendahara: "Ibu Rahmawati, S.E.",
    qrisUrl: "", // bisa diisi url gambar atau default canvas
    rekening: "BSI: 7123-4567-89 (a.n. TPA Al-Hidayah)"
  },
  // 4 Kantong Kas Utama
  wallets: [
    { id: 'ops', name: 'Kas Operasional', desc: 'Dana dari SPP untuk biaya harian TPA', balance: 3450000, icon: 'wallet' },
    { id: 'tabungan', name: 'Kas Tabungan Santri', desc: 'Dana amanah titipan santri (tidak boleh terpakai ops)', balance: 4120000, icon: 'piggy' },
    { id: 'infaq', name: 'Kas Infaq & Sedekah', desc: 'Kotak amal Jumat & donasi sukarela', balance: 1850000, icon: 'heart' },
    { id: 'bangun', name: 'Kas Sarana & Pembangunan', desc: 'Khusus renovasi, meja Al-Quran & sarana', balance: 5200000, icon: 'building' }
  ],
  // Data Pengajar / Ustadz
  teachers: [
    { id: 'G-01', name: 'Ustadz Ahmad Fauzi', phone: '081298765431', role: 'Pengajar Tahsin & Al-Qur\'an', baseSalary: 600000, sessions: 16, status: 'Aktif' },
    { id: 'G-02', name: 'Ustadzah Siti Fatimah', phone: '081387654322', role: 'Pengajar Jilid 3 - 4', baseSalary: 550000, sessions: 14, status: 'Aktif' },
    { id: 'G-03', name: 'Ustadz Muhammad Rizqi', phone: '081976543213', role: 'Pengajar Jilid 1 - 2', baseSalary: 500000, sessions: 15, status: 'Aktif' },
    { id: 'G-04', name: 'Ustadzah Nurul Khadijah', phone: '085265432104', role: 'Pengajar Tahfidz & Doa Harian', baseSalary: 600000, sessions: 16, status: 'Aktif' }
  ],
  // Data Santri
  students: [
    { id: 'S-001', nis: '202601', name: 'Muhammad Zaki Pratama', class: 'Jilid 4', parent: 'Bpk. Hendra Gunawan', phone: '6281211112222', sppAmount: 50000, isScholarship: false, savingsBalance: 180000 },
    { id: 'S-002', nis: '202602', name: 'Aisyah Putri Azzahra', class: 'Tahfidz Juz 30', parent: 'Ibu Ratna Dewi', phone: '6281222223333', sppAmount: 50000, isScholarship: false, savingsBalance: 420000 },
    { id: 'S-003', nis: '202603', name: 'Fatih Al-Ghifari', class: 'Jilid 2', parent: 'Bpk. Bambang Suryo', phone: '6281233334444', sppAmount: 50000, isScholarship: false, savingsBalance: 125000 },
    { id: 'S-004', nis: '202604', name: 'Maryam Syakira', class: 'Al-Qur\'an Dasar', parent: 'Ibu Nurlaila', phone: '6281244445555', sppAmount: 50000, isScholarship: false, savingsBalance: 310000 },
    { id: 'S-005', nis: '202605', name: 'Bilal Habibi', class: 'Jilid 1', parent: 'Ibu Kurniawati (Yatim)', phone: '6281255556666', sppAmount: 0, isScholarship: true, savingsBalance: 90000 },
    { id: 'S-006', nis: '202606', name: 'Khadijah Nayla', class: 'Jilid 3', parent: 'Bpk. Ridwan Hakim', phone: '6281266667777', sppAmount: 50000, isScholarship: false, savingsBalance: 250000 },
    { id: 'S-007', nis: '202607', name: 'Umar Khalid', class: 'Jilid 5', parent: 'Bpk. Irfan Maulana', phone: '6281277778888', sppAmount: 50000, isScholarship: false, savingsBalance: 530000 },
    { id: 'S-008', nis: '202608', name: 'Zahra Anindita', class: 'Jilid 2', parent: 'Ibu Maya Lestari', phone: '6281288889999', sppAmount: 50000, isScholarship: false, savingsBalance: 85000 },
    { id: 'S-009', nis: '202609', name: 'Hasan Basri', class: 'Jilid 6', parent: 'Bpk. Darmawan', phone: '6281299990000', sppAmount: 50000, isScholarship: false, savingsBalance: 610000 },
    { id: 'S-010', nis: '202610', name: 'Aliyya Salsabila', class: 'Tahfidz Juz 30', parent: 'Bpk. Teguh Wibowo', phone: '6281311112222', sppAmount: 50000, isScholarship: false, savingsBalance: 340000 }
  ],
  // Catatan SPP Bulanan (Key: studentId_monthYear, contoh: 'S-001_2026-09')
  sppRecords: [
    { id: 'SPP-01', studentId: 'S-001', month: '2026-09', amount: 50000, paidDate: '2026-09-05', status: 'Lunas', method: 'Tunai', receiptNo: 'KW-2609-001' },
    { id: 'SPP-02', studentId: 'S-002', month: '2026-09', amount: 50000, paidDate: '2026-09-04', status: 'Lunas', method: 'Transfer BSI', receiptNo: 'KW-2609-002' },
    { id: 'SPP-03', studentId: 'S-004', month: '2026-09', amount: 50000, paidDate: '2026-09-07', status: 'Lunas', method: 'QRIS', receiptNo: 'KW-2609-003' },
    { id: 'SPP-04', studentId: 'S-005', month: '2026-09', amount: 0, paidDate: '2026-09-01', status: 'Lunas', method: 'Beasiswa Yatim', receiptNo: 'KW-2609-004' },
    { id: 'SPP-05', studentId: 'S-006', month: '2026-09', amount: 50000, paidDate: '2026-09-10', status: 'Lunas', method: 'Tunai', receiptNo: 'KW-2609-005' },
    { id: 'SPP-06', studentId: 'S-007', month: '2026-09', amount: 50000, paidDate: '2026-09-08', status: 'Lunas', method: 'Tunai', receiptNo: 'KW-2609-006' }
    // S-003, S-008, S-009, S-010 statusnya Belum Lunas untuk bulan 2026-09
  ],
  // Riwayat Tabungan Santri
  savingsTransactions: [
    { id: 'SAV-01', date: '2026-09-14', studentId: 'S-002', type: 'Setor', amount: 20000, note: 'Tabungan pekanan santri' },
    { id: 'SAV-02', date: '2026-09-12', studentId: 'S-007', type: 'Setor', amount: 50000, note: 'Setoran saku santri' },
    { id: 'SAV-03', date: '2026-09-10', studentId: 'S-001', type: 'Setor', amount: 15000, note: 'Tabungan koin' },
    { id: 'SAV-04', date: '2026-09-08', studentId: 'S-009', type: 'Setor', amount: 30000, note: 'Setoran mingguan' },
    { id: 'SAV-05', date: '2026-09-02', studentId: 'S-004', type: 'Tarik', amount: 50000, note: 'Beli jilid Iqro & pensil warna' }
  ],
  // Mutasi Kas Lengkap (Pemasukan & Pengeluaran)
  transactions: [
    { id: 'TX-101', date: '2026-09-01', type: 'in', walletId: 'bangun', category: 'Donasi Pembangunan', amount: 1000000, desc: 'Donasi Hamba Allah untuk perbaikan rak Al-Qur\'an', ref: 'DN-01' },
    { id: 'TX-102', date: '2026-09-04', type: 'in', walletId: 'infaq', category: 'Kotak Infaq Santri', amount: 245000, desc: 'Infaq Jumat santri pekan 1 September', ref: 'INF-01' },
    { id: 'TX-103', date: '2026-09-05', type: 'in', walletId: 'ops', category: 'SPP Santri', amount: 300000, desc: 'Penerimaan SPP Bulan September (6 santri)', ref: 'SPP-REC' },
    { id: 'TX-104', date: '2026-09-06', type: 'out', walletId: 'ops', category: 'Operasional ATK', amount: 145000, desc: 'Pembelian spidol whiteboard, penghapus, dan buku absen', ref: 'NOT-101' },
    { id: 'TX-105', date: '2026-09-08', type: 'out', walletId: 'ops', category: 'Buku & Modul', amount: 320000, desc: 'Pengadaan 10 Eks Buku Iqro Jilid 1-6 & Juz Amma', ref: 'NOT-102' },
    { id: 'TX-106', date: '2026-09-10', type: 'out', walletId: 'ops', category: 'Bisyarah Guru', amount: 2250000, desc: 'Bisyarah/Honor 4 Ustadz/Ustadzah periode Agustus', ref: 'BSY-08' },
    { id: 'TX-107', date: '2026-09-11', type: 'in', walletId: 'infaq', category: 'Kotak Infaq Santri', amount: 210000, desc: 'Infaq Jumat santri pekan 2 September', ref: 'INF-02' },
    { id: 'TX-108', date: '2026-09-12', type: 'out', walletId: 'ops', category: 'Kebersihan & Konsumsi', amount: 95000, desc: 'Beli sabun cuci tangan, galon air minum, dan camilan rapat ustadz', ref: 'NOT-103' },
    { id: 'TX-109', date: '2026-09-13', type: 'in', walletId: 'bangun', category: 'Donasi Donatur Tetap', amount: 500000, desc: 'Donasi bulanan Bpk. H. Sukardi (Muhsinin)', ref: 'DN-02' }
  ]
};

// Modul Akses Data (Repository Pattern)
class TPADatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try {
      return JSON.parse(raw);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
    return this.data;
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
    student.id = 'S-' + String(this.data.students.length + 1).padStart(3, '0');
    student.savingsBalance = 0;
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

  paySpp(studentId, monthStr, amount, method = 'Tunai', customReceiptNo = null) {
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
      receiptNo: receiptNo
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
    teacher.id = 'G-' + String(this.data.teachers.length + 1).padStart(2, '0');
    this.data.teachers.push(teacher);
    this.save();
    return teacher;
  }

  updateTeacher(id, updateData) {
    const t = this.data.teachers.find(item => item.id === id);
    if (t) {
      Object.assign(t, updateData);
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
}

// Global instance
window.db = new TPADatabase();
