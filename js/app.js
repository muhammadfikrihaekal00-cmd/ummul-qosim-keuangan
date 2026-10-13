/**
 * app.js - Main Application Logic & UI Controller untuk SikadTPA
 */

var app = null;

class SikadApp {
  constructor() {
    this.currentTab = 'tab-dashboard';
    this.currentReceipt = null;
    this.sppView = 'table';
    this.sppQuickFilter = 'all';
    this.selectedClassFilter = 'all';
    this.currentWaMsg = '';
    this.currentWaPhone = '';
    this.enteredPin = '';
    this.uploadedAppLogo = null;
    this.uploadedQrisImage = null;
    this.uploadedSppProof = null;
    this.currentReceiptBlob = null;
    this.currentReceiptDataUrl = null;
    this.clockTimer = null;

    // 4 Kelas Resmi RQ Ummul Qosim (Default fallback)
    this._defaultClasses = [
      {
        id: 'K1',
        name: 'Kelas Dasar Ikhwan',
        shortName: 'Dasar Ikhwan',
        teacher: 'Ustadz Muhammad Fikri Haekal',
        room: 'Ruang Shofa',
        schedule: 'Senin - Kamis (16:00 - 17:15 WITA)',
        color: 'emerald',
        icon: '📖'
      },
      {
        id: 'K2',
        name: 'Kelas Menengah Akhowat',
        shortName: 'Menengah Akhowat',
        teacher: 'Ustadzah A. Lulu Aprilia Latifa',
        room: 'Ruang Marwah',
        schedule: 'Senin - Kamis (16:00 - 17:15 WITA)',
        color: 'royal',
        icon: '📗'
      },
      {
        id: 'K3',
        name: 'Kelas Menengah Ikhwan',
        shortName: 'Menengah Ikhwan',
        teacher: 'Ustadzah Khirfatul Jannah',
        room: 'Aula Utama',
        schedule: 'Senin - Kamis (16:00 - 17:30 WITA)',
        color: 'persian',
        icon: '🕌'
      },
      {
        id: 'K4',
        name: 'Kelas Dasar Ikhwan & Akhowat',
        shortName: 'Dasar Gabungan',
        teacher: 'Ustadzah Ummu Khadijah',
        room: 'Serambi Utama',
        schedule: 'Senin - Kamis (16:00 - 17:30 WITA)',
        color: 'amber',
        icon: '⭐'
      }
    ];

    this.init();
  }

  get rqClasses() {
    if (window.db && typeof window.db.getClasses === 'function') {
      return window.db.getClasses();
    }
    return this._defaultClasses;
  }

  init() {
    try {
      this.initSecurityPinGate();
      this.initTheme();
      this.initDynamicDates();
      this.updateRealtimeClock();
      if (this.clockTimer) clearInterval(this.clockTimer);
      this.clockTimer = setInterval(() => this.updateRealtimeClock(), 1000);
      this.bindEvents();
      this.initCommandPalette();
      this.loadTPAInfoToUI();
      this.renderAll();
      const isUnlocked = sessionStorage.getItem('sikadtpa_unlocked') === 'true';
      if (isUnlocked) {
        this.checkUrlAutoUpdate();
      }

      // Sinkronisasi instan jika orang tua mengisi di tab lain pada browser yang sama
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('sikad_sync_channel');
          bc.onmessage = (ev) => {
            if (ev.data && ev.data.type === 'STUDENT_SYNC') {
              const student = window.db.getStudent(ev.data.studentId);
              if (student) {
                window.db.updateStudent(student.id, {
                  name: ev.data.name,
                  fullName: ev.data.fullName,
                  nickname: student.nickname || student.name,
                  parent: ev.data.parent,
                  phone: ev.data.phone
                });
                this.renderAll();
                this.showToast(`⚡ Data santri ${ev.data.name} tersinkronisasi otomatis!`);
              }
            }
          };
        }
      } catch (err) {}
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }

  getCurrentMonthStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  getTodayDateStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  initDynamicDates() {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curMonthKey = this.getCurrentMonthStr();
    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    // 1. Populasi Dropdown Filter Bulan SPP
    const filterMonthEl = document.getElementById('filter-spp-month');
    if (filterMonthEl) {
      let optionsHtml = '';
      for (let offset = 2; offset >= -9; offset--) {
        const d = new Date(curYear, curMonth + offset, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        const isCurrent = key === curMonthKey;
        const label = isCurrent 
          ? `Bulan Ini: ${monthNames[d.getMonth() + 1]} ${y}` 
          : `${monthNames[d.getMonth() + 1]} ${y}`;
        optionsHtml += `<option value="${key}" ${isCurrent ? 'selected' : ''}>${label}</option>`;
      }
      filterMonthEl.innerHTML = optionsHtml;
    }

    // 2. Populasi Dropdown Laporan Keuangan
    const reportPeriodEl = document.getElementById('report-period-select');
    if (reportPeriodEl) {
      let repOptions = '';
      for (let offset = 0; offset >= -6; offset--) {
        const d = new Date(curYear, curMonth + offset, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        const isCurrent = key === curMonthKey;
        const label = isCurrent 
          ? `Bulan Ini (${monthNames[d.getMonth() + 1]} ${y})` 
          : `${monthNames[d.getMonth() + 1]} ${y}`;
        repOptions += `<option value="${key}" ${isCurrent ? 'selected' : ''}>${label}</option>`;
      }
      repOptions += `<option value="${curYear}-year">Tahun ${curYear} (Tahunan)</option>`;
      reportPeriodEl.innerHTML = repOptions;
    }

    // 3. Set input tanggal transaksi kas ke hari ini
    const txDateInput = document.getElementById('tx-date');
    if (txDateInput && !txDateInput.value) {
      txDateInput.value = this.getTodayDateStr();
    }
  }

  updateRealtimeClock() {
    const clockEl = document.getElementById('header-realtime-clock');
    if (!clockEl) return;
    const now = new Date();
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'];
    const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth() + 1];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    clockEl.innerHTML = `📅 <strong>${dayName}, ${dateNum} ${monthName} ${year}</strong> &nbsp;•&nbsp; ⏰ <strong>${hours}:${minutes}:${seconds}</strong> <small>WIB</small>`;
  }

  normalizeClassKey(className) {
    if (!className) return 'K1';
    const clean = String(className).trim();
    // 1. Cocokkan ID langsung (K1, K2, K3, K4)
    const byId = this.rqClasses.find(cls => cls.id.toLowerCase() === clean.toLowerCase());
    if (byId) return byId.id;
    // 2. Cocokkan nama lengkap atau nama singkat secara persis
    const lower = clean.toLowerCase();
    const byExact = this.rqClasses.find(cls => cls.name.toLowerCase() === lower || (cls.shortName && cls.shortName.toLowerCase() === lower));
    if (byExact) return byExact.id;
    // 3. Cocokkan substring pada nama kelas saat ini
    const bySub = this.rqClasses.find(cls => cls.name.toLowerCase().includes(lower) || lower.includes(cls.name.toLowerCase()) || (cls.shortName && (lower.includes(cls.shortName.toLowerCase()) || cls.shortName.toLowerCase().includes(lower))));
    if (bySub) return bySub.id;
    // 4. Fallback kata kunci bawaan
    if (lower.includes('tahfidz') || lower.includes('juz 30') || lower.includes('kelas 4') || lower.includes('k4')) return 'K4';
    if (lower.includes('tahsin') || lower.includes("qur'an") || lower.includes('quran') || lower.includes('kelas 3') || lower.includes('k3')) return 'K3';
    if (lower.includes('jilid 3') || lower.includes('jilid 4') || lower.includes('jilid 5') || lower.includes('jilid 6') || lower.includes('kelas 2') || lower.includes('k2')) return 'K2';
    if (lower.includes('jilid 1') || lower.includes('jilid 2') || lower.includes('iqro') || lower.includes('kelas 1') || lower.includes('k1')) return 'K1';
    return 'K1';
  }

  // Format Helper Rupiah
  formatRp(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  // Format Tanggal Indonesia
  formatDateId(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1])]} ${parts[0]}`;
  }

  formatMonthId(monthStr) {
    if (!monthStr) return '-';
    const [year, month] = monthStr.split('-');
    const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(month)]} ${year}`;
  }

  // Binding Event Listeners
  bindEvents() {
    // Nav Items Tab Switching
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tabId = item.getAttribute('data-tab');
        if (tabId) this.switchTab(tabId);
      });
    });

    // Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
      });
    }

    // Direct Event Listeners for All Input Buttons
    // 1. Header Buttons
    document.getElementById('btn-header-add-student')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openStudentModal();
    });
    document.getElementById('btn-header-add-teacher')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTeacherModal();
    });
    document.getElementById('btn-open-tx-modal')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTxModal('in', 'ops');
    });

    // 2. Vault Action Buttons
    document.getElementById('btn-vault-income')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTxModal('in', 'ops');
    });
    document.getElementById('btn-vault-expense')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTxModal('out', 'ops');
    });
    document.getElementById('btn-vault-qris')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openQRISModal();
    });

    // 3. Tab SPP Buttons
    document.getElementById('btn-spp-add-student')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openStudentModal();
    });
    document.getElementById('btn-spp-spreadsheet')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSpreadsheetModal();
    });

    // 4. Tab Tabungan Buttons
    document.getElementById('btn-tabungan-setor')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSavingsModal('Setor');
    });
    document.getElementById('btn-tabungan-tarik')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSavingsModal('Tarik');
    });

    // 5. Tab Infaq Buttons
    document.getElementById('btn-infaq-show-qris')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openQRISModal();
    });
    document.getElementById('btn-infaq-add-tx')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openInfaqModal();
    });

    // 6. Tab Bisyarah & Pengeluaran Buttons
    document.getElementById('btn-expense-add-teacher')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTeacherModal();
    });
    document.getElementById('btn-expense-add-expense')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openExpenseModal();
    });

    // 7. Tab Master Data Buttons
    document.getElementById('btn-master-add-student')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openStudentModal();
    });
    document.getElementById('btn-master-add-teacher')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTeacherModal();
    });

    // Modal Form Submit & Save Buttons
    document.getElementById('btn-save-student')?.addEventListener('click', (e) => this.submitStudent(e));
    document.getElementById('btn-save-teacher')?.addEventListener('click', (e) => this.submitTeacher(e));
    document.getElementById('btn-save-tx')?.addEventListener('click', (e) => this.submitTx(e));
    document.getElementById('btn-save-savings')?.addEventListener('click', (e) => this.submitSavings(e));
    document.getElementById('btn-save-pay-spp')?.addEventListener('click', (e) => this.submitPaySpp(e));

    // Global Modal Backdrop Click to Close (Klik area gelap di luar box, tahan drag/seleksi teks tidak keluar)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      let isBackdropPress = false;
      modal.addEventListener('mousedown', (e) => {
        isBackdropPress = (e.target === modal);
      });
      modal.addEventListener('mouseup', (e) => {
        if (isBackdropPress && e.target === modal) {
          this.closeModal(modal.id);
        }
        isBackdropPress = false;
      });
      // Cegah klik / seleksi di dalam modal box memicu penutupan tidak sengaja
      const box = modal.querySelector('.modal-box');
      if (box) {
        box.addEventListener('click', (e) => e.stopPropagation());
      }
    });

    // Cegah form modal keluar sendiri / submit tiba-tiba saat menekan Enter saat mengetik input
    ['form-teacher', 'form-student', 'form-edit-class', 'form-tx', 'form-savings', 'form-pay-spp'].forEach(fId => {
      const f = document.getElementById(fId);
      if (f) {
        f.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            const inputs = Array.from(f.querySelectorAll('input:not([type="hidden"]), select'));
            const idx = inputs.indexOf(e.target);
            if (idx >= 0 && idx < inputs.length - 1) {
              inputs[idx + 1].focus();
            }
          }
        });
      }
    });

    // Escape Key to Close Active Modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          this.closeModal(modal.id);
        });
      }
    });

    // Global Event Delegation for [data-action]
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      if (action === 'open-student-modal') {
        e.preventDefault();
        this.openStudentModal();
      } else if (action === 'open-teacher-modal') {
        e.preventDefault();
        this.openTeacherModal();
      } else if (action === 'open-tx-modal') {
        e.preventDefault();
        const type = target.getAttribute('data-tx-type') || 'in';
        const wallet = target.getAttribute('data-tx-wallet') || 'ops';
        this.openTxModal(type, wallet);
      } else if (action === 'open-savings-modal') {
        e.preventDefault();
        const type = target.getAttribute('data-savings-type') || 'Setor';
        this.openSavingsModal(type);
      } else if (action === 'open-infaq-modal') {
        e.preventDefault();
        this.openInfaqModal();
      } else if (action === 'open-expense-modal') {
        e.preventDefault();
        this.openExpenseModal();
      } else if (action === 'open-qris-modal') {
        e.preventDefault();
        this.openQRISModal();
      }
    });

    // Filter Listeners SPP
    const filterSearch = document.getElementById('filter-spp-search');
    const filterMonth = document.getElementById('filter-spp-month');
    const filterClass = document.getElementById('filter-spp-class');
    const filterStatus = document.getElementById('filter-spp-status');

    if (filterSearch) filterSearch.addEventListener('input', () => this.renderSppTable());
    if (filterMonth) filterMonth.addEventListener('change', () => {
      this.renderSppTable();
      this.renderDashboard();
    });
    if (filterClass) filterClass.addEventListener('change', () => this.renderSppTable());
    if (filterStatus) filterStatus.addEventListener('change', () => this.renderSppTable());

    // Filter Tabungan Santri
    const filterSavingsSearch = document.getElementById('filter-savings-search');
    if (filterSavingsSearch) {
      filterSavingsSearch.addEventListener('input', () => this.renderSavings());
    }

    // Set default date for transactions form
    const txDateInput = document.getElementById('tx-date');
    if (txDateInput) {
      txDateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  // Switch Tab
  switchTab(tabId) {
    this.currentTab = tabId;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
    });

    // Update active tab section
    document.querySelectorAll('.tab-view').forEach(el => {
      el.classList.toggle('active', el.id === tabId);
    });

    // Close mobile sidebar if open
    document.getElementById('sidebar').classList.remove('show');

    // Update Header Title
    const titles = {
      'tab-dashboard': { title: 'Dashboard Kas', desc: 'Ikhtisar saldo kas multi-kantong dan aktivitas keuangan TPA' },
      'tab-spp': { title: 'SPP & Syahriah Santri', desc: 'Catat pembayaran, cetak kuitansi, dan kirim pengingat ramah via WhatsApp' },
      'tab-tabungan': { title: 'Buku Tabungan Santri', desc: 'Pengelolaan dana titipan amanah tabungan santri' },
      'tab-infaq': { title: 'Infaq, Sedekah & QRIS', desc: 'Penerimaan kotak amal Jumat, donatur tetap, dan zakat/fidyah' },
      'tab-pengeluaran': { title: 'Bisyarah & Operasional', desc: 'Honorarium ustadz/ustadzah dan belanja operasional ATK / Modul' },
      'tab-laporan': { title: 'Laporan Keuangan Resmi', desc: 'Rekapitulasi arus kas siap cetak untuk Takmir Masjid & Wali Santri' },
      'tab-master': { title: 'Master Data & Profil', desc: 'Kelola data santri, ustadz, dan identitas lembaga TPA' },
      'tab-panduan': { title: 'Panduan Ubah Isi & Tema', desc: 'Panduan lengkap cara mengubah profil, data santri, ustadz, dan tema aplikasi' }
    };

    if (titles[tabId]) {
      document.getElementById('current-page-title').innerText = titles[tabId].title;
      document.getElementById('current-page-desc').innerText = titles[tabId].desc;
    }

    // Re-render corresponding view
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    switch (this.currentTab) {
      case 'tab-dashboard':
        this.renderDashboard();
        break;
      case 'tab-spp':
        this.renderSppTable();
        break;
      case 'tab-tabungan':
        this.renderSavings();
        break;
      case 'tab-infaq':
        this.renderInfaq();
        break;
      case 'tab-pengeluaran':
        this.renderExpenses();
        break;
      case 'tab-laporan':
        this.generateReport();
        break;
      case 'tab-master':
        this.renderMasterData();
        break;
    }
  }

  renderAll() {
    try { this.renderDashboard(); } catch (e) { console.error('Dashboard render error:', e); }
    try { this.renderSppTable(); } catch (e) { console.error('SPP Table render error:', e); }
    try { this.renderSavings(); } catch (e) { console.error('Savings render error:', e); }
    try { this.renderInfaq(); } catch (e) { console.error('Infaq render error:', e); }
    try { this.renderExpenses(); } catch (e) { console.error('Expenses render error:', e); }
    try { this.generateReport(); } catch (e) { console.error('Report render error:', e); }
    try { this.renderMasterData(); } catch (e) { console.error('MasterData render error:', e); }
  }

  loadTPAInfoToUI() {
    const info = window.db.getTPAInfo();
    if (!info) return;

    // Document Title
    document.title = `${info.appName || 'SikadTPA'} - ${info.nama || 'RQ Ummul Qosim'}`;

    // App Title & Logo in Sidebar
    const appTitleEl = document.getElementById('sidebar-app-title');
    if (appTitleEl) {
      const fullApp = info.appName || 'SikadTPA';
      // Render dengan aksen stylish jika ada kata TPA atau RQ
      if (fullApp.toLowerCase().includes('sikadtpa')) {
        appTitleEl.innerHTML = `Sikad<span>TPA</span>`;
      } else {
        appTitleEl.innerText = fullApp;
      }
    }

    const sidebarLogoContent = document.getElementById('sidebar-app-logo-content');
    if (sidebarLogoContent) {
      if (info.appLogo) {
        sidebarLogoContent.innerHTML = `<img src="${info.appLogo}" class="sidebar-logo-img" alt="Logo">`;
      } else {
        sidebarLogoContent.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <circle cx="12" cy="8.5" r="2.2" fill="currentColor"></circle>
          </svg>`;
      }
    }

    // PIN Screen Branding
    const pinTitle = document.getElementById('pin-app-title');
    if (pinTitle) pinTitle.innerText = info.appName || 'SikadTPA Keuangan';
    
    const pinSub = document.getElementById('pin-tpa-subtitle');
    if (pinSub) pinSub.innerText = `${info.nama || 'RQ Ummul Qosim'} • Sistem Kas Terpadu`;

    const pinLogoContent = document.getElementById('pin-brand-logo-content');
    if (pinLogoContent) {
      if (info.appLogo) {
        pinLogoContent.innerHTML = `<img src="${info.appLogo}" class="pin-logo-img" alt="Logo">`;
      } else {
        pinLogoContent.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            <circle cx="12" cy="16" r="1.5" fill="currentColor"></circle>
          </svg>`;
      }
    }

    // Sidebar Institution Name & User
    const sidebarTpaName = document.getElementById('sidebar-tpa-name');
    if (sidebarTpaName) sidebarTpaName.innerText = info.nama;

    const sidebarUserName = document.getElementById('sidebar-user-name');
    if (sidebarUserName) sidebarUserName.innerText = info.bendahara;

    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (avatarEl && info.bendahara) {
      const cleanName = info.bendahara.replace(/^(Ibu|Bpk\.|Bapak|Ustadz|Ustadzah)\s+/i, '').trim();
      const initials = cleanName.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
      avatarEl.innerText = initials || 'BD';
    }

    // Modal QRIS Displays
    const qrisName = document.getElementById('qris-tpa-name');
    if (qrisName) qrisName.innerText = (info.qrisMerchant || info.nama || 'TPA').toUpperCase();

    const qrisNmidEl = document.getElementById('qris-tpa-nmid');
    if (qrisNmidEl) qrisNmidEl.innerText = `NMID: ${info.qrisNmid || 'ID1026091234567 • A01'}`;

    const qrisMockupEl = document.getElementById('qris-default-mockup');
    const qrisRealImgEl = document.getElementById('qris-real-img');
    const qrisNoticeEl = document.getElementById('qris-notice-upload');

    if (info.qrisUrl) {
      if (qrisRealImgEl) {
        qrisRealImgEl.src = info.qrisUrl;
        qrisRealImgEl.style.display = 'block';
      }
      if (qrisMockupEl) qrisMockupEl.style.display = 'none';
      if (qrisNoticeEl) qrisNoticeEl.style.display = 'none';
    } else {
      if (qrisRealImgEl) qrisRealImgEl.style.display = 'none';
      if (qrisMockupEl) qrisMockupEl.style.display = 'flex';
      if (qrisNoticeEl) qrisNoticeEl.style.display = 'block';
    }

    // Receipt Modal Branding
    const rcpName = document.getElementById('rcp-tpa-name');
    if (rcpName) rcpName.innerText = (info.nama || 'TPA').toUpperCase();

    const repSignTitleKetua = document.getElementById('rep-sign-title-ketua');
    if (repSignTitleKetua) repSignTitleKetua.innerText = `Ketua ${info.nama}`;

    // Master Settings Form Inputs (Tab Pengaturan Lembaga)
    const elAppName = document.getElementById('info-app-name');
    if (elAppName) elAppName.value = info.appName || 'SikadTPA Keuangan';

    // Logo preview in settings form
    const logoPreviewBox = document.getElementById('info-app-logo-preview-box');
    const logoPreviewImg = document.getElementById('info-app-logo-preview');
    if (info.appLogo && logoPreviewBox && logoPreviewImg) {
      logoPreviewImg.src = info.appLogo;
      logoPreviewBox.style.display = 'flex';
    } else if (logoPreviewBox) {
      logoPreviewBox.style.display = 'none';
    }

    const elName = document.getElementById('info-tpa-name');
    if (elName) elName.value = info.nama || '';

    const elMasjid = document.getElementById('info-tpa-masjid');
    if (elMasjid) elMasjid.value = info.masjid || '';

    const elAlamat = document.getElementById('info-tpa-alamat');
    if (elAlamat) elAlamat.value = info.alamat || '';

    const elKontak = document.getElementById('info-tpa-kontak');
    if (elKontak) elKontak.value = info.kontak || '';

    const elKetua = document.getElementById('info-tpa-ketua');
    if (elKetua) elKetua.value = info.ketua || '';

    const elBendahara = document.getElementById('info-tpa-bendahara');
    if (elBendahara) elBendahara.value = info.bendahara || '';

    const elPin = document.getElementById('info-tpa-pin');
    if (elPin) elPin.value = window.db.getSecurityPin() || '060708';

    // QRIS settings inputs
    const elQrisNmid = document.getElementById('info-qris-nmid');
    if (elQrisNmid) elQrisNmid.value = info.qrisNmid || '';

    const elQrisMerchant = document.getElementById('info-qris-merchant');
    if (elQrisMerchant) elQrisMerchant.value = info.qrisMerchant || '';

    const elRekening = document.getElementById('info-tpa-rekening');
    if (elRekening) elRekening.value = info.rekening || '';

    // QRIS preview in settings form
    const qrisPreviewBox = document.getElementById('info-qris-preview-box');
    const qrisPreviewImg = document.getElementById('info-qris-preview');
    if (info.qrisUrl && qrisPreviewBox && qrisPreviewImg) {
      qrisPreviewImg.src = info.qrisUrl;
      qrisPreviewBox.style.display = 'flex';
    } else if (qrisPreviewBox) {
      qrisPreviewBox.style.display = 'none';
    }
  }

  // =========================================================================
  // 1. DASHBOARD CONTROLLER (LUXURY BENTO FINTECH GRID)
  // =========================================================================
  renderDashboard() {
    const wallets = window.db.getWallets();
    const walletsCapsuleContainer = document.getElementById('wallets-capsule-container');
    
    let totalAllBalances = 0;
    wallets.forEach(w => totalAllBalances += w.balance);

    // Update Master Vault Balance
    const masterBalEl = document.getElementById('vault-master-total-balance');
    if (masterBalEl) masterBalEl.innerText = this.formatRp(totalAllBalances);

    // Compute percentage allocations
    const safeTotal = totalAllBalances > 0 ? totalAllBalances : 1;
    const opsW = wallets.find(w => w.id === 'ops') || { balance: 0 };
    const tabunganW = wallets.find(w => w.id === 'tabungan') || { balance: 0 };
    const infaqW = wallets.find(w => w.id === 'infaq') || { balance: 0 };
    const bangunW = wallets.find(w => w.id === 'bangun') || { balance: 0 };

    const pctOps = totalAllBalances > 0 ? Math.round((opsW.balance / safeTotal) * 100) : 0;
    const pctTabungan = totalAllBalances > 0 ? Math.round((tabunganW.balance / safeTotal) * 100) : 0;
    const pctInfaq = totalAllBalances > 0 ? Math.round((infaqW.balance / safeTotal) * 100) : 0;
    const pctBangun = totalAllBalances > 0 ? Math.max(0, 100 - (pctOps + pctTabungan + pctInfaq)) : 0;

    // Update Allocation Bar Segments
    const allocOps = document.getElementById('alloc-ops');
    if (allocOps) allocOps.style.width = `${pctOps}%`;
    const allocTabungan = document.getElementById('alloc-tabungan');
    if (allocTabungan) allocTabungan.style.width = `${pctTabungan}%`;
    const allocInfaq = document.getElementById('alloc-infaq');
    if (allocInfaq) allocInfaq.style.width = `${pctInfaq}%`;
    const allocBangun = document.getElementById('alloc-bangun');
    if (allocBangun) allocBangun.style.width = `${pctBangun}%`;

    const elPctOps = document.getElementById('pct-ops');
    if (elPctOps) elPctOps.innerText = `${pctOps}%`;
    const elPctTabungan = document.getElementById('pct-tabungan');
    if (elPctTabungan) elPctTabungan.innerText = `${pctTabungan}%`;
    const elPctInfaq = document.getElementById('pct-infaq');
    if (elPctInfaq) elPctInfaq.innerText = `${pctInfaq}%`;
    const elPctBangun = document.getElementById('pct-bangun');
    if (elPctBangun) elPctBangun.innerText = `${pctBangun}%`;

    // Render 4 Vault Capsules
    if (walletsCapsuleContainer) {
      const capsuleMeta = {
        ops: { icon: '💼', badge: 'Utama', sub: 'Kas Operasional & Honor', desc: 'Dana likuid untuk honor ustadz dan kegiatan KBM harian.' },
        tabungan: { icon: '🔒', badge: 'Titipan Syariah', sub: 'Kas Tabungan Santri', desc: 'Dana titipan amanah tabungan santri. Terlindungi & terpisah.' },
        infaq: { icon: '🤲', badge: 'Amal Jariyah', sub: 'Kas Infaq & Sedekah', desc: 'Penerimaan kotak amal Jumat, donatur tetap & QRIS.' },
        bangun: { icon: '🕌', badge: 'Pengembangan', sub: 'Kas Pembangunan & Sarpras', desc: 'Alokasi khusus renovasi kelas, AC, sound & fasilitas TPA.' }
      };

      walletsCapsuleContainer.innerHTML = wallets.map(w => {
        const meta = capsuleMeta[w.id] || { icon: '💳', badge: 'Kas', sub: w.name, desc: w.desc };
        return `
          <div class="vault-capsule-card vault-${w.id}">
            <div>
              <div class="capsule-top">
                <div class="capsule-icon-pebble">${meta.icon}</div>
                <span class="capsule-badge-pill">${meta.badge}</span>
              </div>
              <div class="capsule-title">${meta.sub}</div>
              <div class="capsule-amount">${this.formatRp(w.balance)}</div>
            </div>
            <div class="capsule-desc">${meta.desc}</div>
          </div>
        `;
      }).join('');
    }

    // SPP Metrics & Circular SVG Radar Gauge
    const currentMonth = document.getElementById('filter-spp-month')?.value || this.getCurrentMonthStr();
    const students = window.db.getStudents();
    let paidCount = 0;
    let totalTarget = 0;
    let totalCollected = 0;
    let scholarshipCount = 0;

    students.forEach(s => {
      if (s.isScholarship) {
        scholarshipCount++;
      } else {
        totalTarget += s.sppAmount;
        const status = window.db.getSppStatus(s.id, currentMonth);
        if (status.isPaid) {
          paidCount++;
          totalCollected += (status.record ? status.record.amount : 0);
        }
      }
    });

    const unpaidCount = students.length - paidCount - scholarshipCount;
    const badgeUnpaid = document.getElementById('badge-unpaid-spp');
    if (badgeUnpaid) badgeUnpaid.innerText = unpaidCount;

    // SPP Radar Circle
    const pct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 100;
    const circleFill = document.getElementById('spp-circle-fill');
    if (circleFill) {
      // Circumference 2 * pi * 50 ≈ 314
      const offset = 314 - (314 * Math.min(pct, 100) / 100);
      circleFill.style.strokeDashoffset = offset;
    }
    const circlePct = document.getElementById('spp-circle-pct');
    if (circlePct) circlePct.innerText = `${pct}%`;

    const elPaidCount = document.getElementById('spp-count-paid');
    if (elPaidCount) elPaidCount.innerText = `${paidCount} Santri`;
    const elUnpaidCount = document.getElementById('spp-count-unpaid');
    if (elUnpaidCount) elUnpaidCount.innerText = `${unpaidCount} Santri`;
    const elScholarshipCount = document.getElementById('spp-count-scholarship');
    if (elScholarshipCount) elScholarshipCount.innerText = `${scholarshipCount} Santri`;

    const elSppCollected = document.getElementById('spp-radar-collected');
    if (elSppCollected) elSppCollected.innerText = this.formatRp(totalCollected);
    const elSppTarget = document.getElementById('spp-radar-target');
    if (elSppTarget) elSppTarget.innerText = this.formatRp(totalTarget);

    // Cashflow Bar Chart
    this.renderCashflowChart();

    // Recent Transactions Stream
    this.renderRecentTransactions();
  }

  renderCashflowChart() {
    const chartWrap = document.getElementById('dashboard-cashflow-chart');
    if (!chartWrap) return;

    // Mock data for 6 months
    const monthsData = [
      { label: 'Apr 26', inVal: 2400000, outVal: 1800000 },
      { label: 'Mei 26', inVal: 2900000, outVal: 2100000 },
      { label: 'Jun 26', inVal: 3200000, outVal: 2400000 },
      { label: 'Jul 26', inVal: 2700000, outVal: 2200000 },
      { label: 'Agu 26', inVal: 3500000, outVal: 2800000 },
      { label: 'Sep 26', inVal: 2055000, outVal: 2810000 }
    ];

    const maxVal = 4000000;
    chartWrap.innerHTML = monthsData.map(m => {
      const inHeight = Math.max(10, Math.round((m.inVal / maxVal) * 150));
      const outHeight = Math.max(10, Math.round((m.outVal / maxVal) * 150));
      return `
        <div class="chart-col">
          <div class="chart-bars">
            <div class="chart-bar in" style="height: ${inHeight}px;" data-tooltip="Masuk: ${this.formatRp(m.inVal)}"></div>
            <div class="chart-bar out" style="height: ${outHeight}px;" data-tooltip="Keluar: ${this.formatRp(m.outVal)}"></div>
          </div>
          <span class="chart-label">${m.label}</span>
        </div>
      `;
    }).join('');
  }

  renderRecentTransactions() {
    const listEl = document.getElementById('recent-transactions-list');
    if (!listEl) return;

    const txs = window.db.getTransactions().slice(0, 5);
    if (txs.length === 0) {
      listEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--slate-400); text-align: center; padding: 24px;">Belum ada mutasi kas.</p>`;
      return;
    }

    const walletNames = {
      ops: 'Kas Operasional',
      tabungan: 'Kas Tabungan',
      infaq: 'Kas Infaq',
      bangun: 'Kas Sarpras'
    };

    listEl.innerHTML = txs.map(t => {
      const isIncome = t.type === 'in';
      return `
        <div class="recent-stream-item">
          <div class="recent-stream-left">
            <div class="stream-direction-badge ${isIncome ? 'in' : 'out'}">
              ${isIncome ? '↓' : '↑'}
            </div>
            <div>
              <div class="stream-meta-title">${t.category}</div>
              <div class="stream-meta-sub">${this.formatDateId(t.date)} • ${walletNames[t.walletId] || t.walletId}</div>
            </div>
          </div>
          <div class="stream-amount ${isIncome ? 'in' : 'out'}">
            ${isIncome ? '+' : '-'}${this.formatRp(t.amount)}
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. MODUL SPP & SYAHRIAH (DUAL VIEW, 4 KELAS RQ & SMART CAPSULES)
  // =========================================================================
  setSppView(mode) {
    this.sppView = mode;
    const btnCards = document.getElementById('btn-view-cards');
    const btnTable = document.getElementById('btn-view-table');
    if (btnCards) btnCards.classList.toggle('active', mode === 'cards');
    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    this.renderSppTable();
  }

  setSppQuickFilter(filter) {
    this.sppQuickFilter = filter;
    document.querySelectorAll('#spp-quick-filter-bar .capsule-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-spp-filter') === filter);
    });
    this.renderSppTable();
  }

  setSppClassFilter(classId) {
    this.selectedClassFilter = classId || 'all';
    document.querySelectorAll('#spp-class-filter-bar .spp-class-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-class-filter') === this.selectedClassFilter);
    });
    this.renderSppTable();
  }

  renderSppTable() {
    const wrapper = document.getElementById('spp-classes-wrapper');
    if (!wrapper) return;

    const selectedMonth = document.getElementById('filter-spp-month')?.value || this.getCurrentMonthStr();
    const searchQuery = (document.getElementById('filter-spp-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filter-spp-status')?.value || '';

    const allStudents = window.db.getStudents();

    // 1. Hitung metrik keseluruhan untuk kapsul ringkasan
    let countAll = allStudents.length;
    let countUnpaid = 0;
    let countPaid = 0;
    let countScholarship = 0;

    // Penghitung santri per kelas RQ dinamis
    const classCounters = { all: countAll };
    this.rqClasses.forEach(c => {
      classCounters[c.id] = 0;
    });

    allStudents.forEach(s => {
      const cKey = this.normalizeClassKey(s.class);
      if (classCounters[cKey] !== undefined) classCounters[cKey]++;

      if (s.isScholarship) {
        countScholarship++;
      } else {
        const st = window.db.getSppStatus(s.id, selectedMonth);
        if (st && st.isPaid) countPaid++;
        else countUnpaid++;
      }
    });

    // Update angka kapsul cepat
    const elCountAll = document.getElementById('count-capsule-all');
    if (elCountAll) elCountAll.innerText = countAll;
    const elCountUnpaid = document.getElementById('count-capsule-unpaid');
    if (elCountUnpaid) elCountUnpaid.innerText = countUnpaid;
    const elCountPaid = document.getElementById('count-capsule-paid');
    if (elCountPaid) elCountPaid.innerText = countPaid;
    const elCountScholarship = document.getElementById('count-capsule-scholarship');
    if (elCountScholarship) elCountScholarship.innerText = countScholarship;

    // Render / update bilah tab filter kelas secara dinamis
    const filterBar = document.getElementById('spp-class-filter-bar');
    if (filterBar) {
      let tabsHtml = `
        <button type="button" class="spp-class-tab-btn ${this.selectedClassFilter === 'all' ? 'active' : ''}" data-class-filter="all" onclick="app.setSppClassFilter('all')">
          <span>🏢 Semua ${this.rqClasses.length} Kelas</span>
          <span class="spp-class-tab-badge" id="badge-class-all">${countAll}</span>
        </button>
      `;
      this.rqClasses.forEach(c => {
        const count = classCounters[c.id] || 0;
        const isActive = this.selectedClassFilter === c.id;
        tabsHtml += `
          <button type="button" class="spp-class-tab-btn ${isActive ? 'active' : ''}" data-class-filter="${c.id}" onclick="app.setSppClassFilter('${c.id}')">
            <span>${c.icon} ${c.shortName}</span>
            <span class="spp-class-tab-badge" id="badge-class-${c.id.toLowerCase()}">${count}</span>
          </button>
        `;
      });
      filterBar.innerHTML = tabsHtml;
    }

    // 2. Render Tabel Terpisah untuk Masing-Masing dari 4 Kelas RQ
    let totalRenderedCount = 0;
    let outputHtml = '';

    const visibleClasses = this.rqClasses.filter(c => {
      if (this.selectedClassFilter === 'all') return true;
      return c.id === this.selectedClassFilter;
    });

    visibleClasses.forEach(c => {
      const enrolledStudents = allStudents.filter(s => this.normalizeClassKey(s.class) === c.id);

      // Hitung metrik spesifik kelas ini
      let clsPaid = 0;
      let clsUnpaid = 0;
      let clsScholar = 0;
      let clsCollected = 0;

      enrolledStudents.forEach(s => {
        if (s.isScholarship) {
          clsScholar++;
        } else {
          const st = window.db.getSppStatus(s.id, selectedMonth);
          if (st && st.isPaid) {
            clsPaid++;
            clsCollected += (st.record ? st.record.amount : s.sppAmount);
          } else {
            clsUnpaid++;
          }
        }
      });

      // Filter santri di dalam kelas ini berdasarkan filter pencarian & status
      const filteredInClass = enrolledStudents.filter(s => {
        const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
        const isPaid = sppStatus && sppStatus.isPaid;
        const statusLabel = isPaid ? 'Lunas' : 'Belum Lunas';

        if (this.sppQuickFilter === 'unpaid' && (s.isScholarship || isPaid)) return false;
        if (this.sppQuickFilter === 'paid' && (s.isScholarship || !isPaid)) return false;
        if (this.sppQuickFilter === 'scholarship' && !s.isScholarship) return false;

        if (searchQuery) {
          const nameMatch = s.name.toLowerCase().includes(searchQuery);
          const parentMatch = s.parent && s.parent.toLowerCase().includes(searchQuery);
          const nisMatch = s.nis && String(s.nis).includes(searchQuery);
          const phoneMatch = s.phone && String(s.phone).includes(searchQuery);
          if (!nameMatch && !parentMatch && !nisMatch && !phoneMatch) return false;
        }

        if (statusFilter && statusFilter !== statusLabel) return false;

        return true;
      });

      totalRenderedCount += filteredInClass.length;

      // Buat Body Konten (Tabel vs Visual Kartu)
      let bodyContentHtml = '';

      if (filteredInClass.length === 0) {
        bodyContentHtml = `
          <div class="spp-class-empty">
            <div style="font-size: 1.6rem; margin-bottom: 6px;">🍃</div>
            <div style="font-weight: 700; color: var(--slate-600);">Tidak ada santri yang sesuai kriteria di ${c.name}</div>
            <div style="font-size: 0.75rem; color: var(--slate-400); margin-top: 3px;">Daftarkan santri baru untuk kelas ini menggunakan tombol di bawah:</div>
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="app.openStudentModal('${c.id}')" style="margin-top: 10px;">
              ➕ Daftarkan Santri ke ${c.shortName}
            </button>
          </div>
        `;
      } else if (this.sppView === 'cards') {
        bodyContentHtml = `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; padding: 16px;">
            ${filteredInClass.map(s => {
              const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
              const isPaid = sppStatus && sppStatus.isPaid;
              const initials = s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

              let statusTag = '';
              let footerActions = '';

              if (s.isScholarship) {
                statusTag = `<span class="badge badge-warning">⭐ Beasiswa Yatim</span>`;
                footerActions = `
                  <div style="display: flex; gap: 6px; width: 100%; justify-content: flex-end; align-items: center;">
                    <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                      🔗
                    </button>
                    <span style="font-size: 0.74rem; font-weight: 700; color: var(--gold-600); background: var(--gold-50); padding: 5px 12px; border-radius: var(--radius-full);">Bebas Syahriah</span>
                  </div>
                `;
              } else if (isPaid) {
                statusTag = `<span class="badge badge-success">✓ Lunas (${sppStatus.record?.method || 'Tunai'})</span>`;
                footerActions = `
                  <div style="display: flex; gap: 6px; width: 100%; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                      🔗
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm btn-icon-only" onclick="app.showReceiptById('${sppStatus.record.id}')" title="Cetak Kuitansi Struk">
                      🧾
                    </button>
                    <button type="button" class="btn btn-whatsapp btn-sm btn-icon-only" onclick="app.openReceiptWaPreview('${s.id}', '${sppStatus.record.id}')" title="Kirim WA Kuitansi">
                      📲
                    </button>
                    <button type="button" class="btn btn-danger btn-sm btn-icon-only" onclick="app.cancelSppPaymentPrompt('${sppStatus.record.id}')" title="Batalkan Pelunasan">
                      ↩️
                    </button>
                  </div>
                `;
              } else {
                statusTag = `<span class="badge badge-danger">✕ Belum Lunas</span>`;
                footerActions = `
                  <div style="display: flex; gap: 6px; width: 100%; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                      🔗
                    </button>
                    <button type="button" class="btn btn-primary btn-sm btn-icon-only" onclick="app.openPaySppModal('${s.id}', '${selectedMonth}')" title="Catat Pembayaran SPP">
                      💳
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm btn-icon-only" onclick="app.openReminderWaPreview('${s.id}', '${selectedMonth}')" title="Kirim Tagihan Pengingat WA">
                      💬
                    </button>
                  </div>
                `;
              }

              return `
                <div class="student-visual-card">
                  <div>
                    <div class="std-card-header">
                      <div class="std-avatar">${initials}</div>
                      <div class="std-meta">
                        <div class="std-name">${s.name}</div>
                        <div class="std-nis-class">
                          <span class="std-badge-nis">NIS: ${s.nis}</span>
                          <span class="std-badge-class">${s.class}</span>
                        </div>
                      </div>
                    </div>
                    <div class="std-details-list">
                      <div class="std-detail-item">
                        <span class="lbl">Wali Santri</span>
                        <span class="val">${s.parent}</span>
                      </div>
                      <div class="std-detail-item">
                        <span class="lbl">WhatsApp</span>
                        <span class="val">${s.phone}</span>
                      </div>
                      <div class="std-detail-item">
                        <span class="lbl">Tarif SPP</span>
                        <span class="val">${this.formatRp(s.sppAmount)}</span>
                      </div>
                      <div class="std-detail-item">
                        <span class="lbl">Status</span>
                        <div>${statusTag}</div>
                      </div>
                    </div>
                  </div>
                  <div class="std-card-footer">
                    ${footerActions}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        bodyContentHtml = `
          <div class="table-responsive">
            <table class="table-app spp-table-perclass" style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th style="width: 80px;">NIS</th>
                  <th>Nama Santri</th>
                  <th>Wali & No. WhatsApp</th>
                  <th style="width: 120px;">Tarif SPP</th>
                  <th style="width: 165px;">Status (${this.formatMonthId(selectedMonth)})</th>
                  <th style="text-align: right; width: 175px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${filteredInClass.map(s => {
                  const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
                  const isPaid = sppStatus && sppStatus.isPaid;
                  let badgeHtml = '';
                  let actionButtons = '';

                  if (s.isScholarship) {
                    badgeHtml = `<span class="badge badge-warning">⭐ Beasiswa Yatim</span>`;
                    actionButtons = `
                      <div class="cell-actions" style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                        <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                          🔗
                        </button>
                        <span style="font-size: 0.75rem; color: var(--slate-400); font-weight: 600;">Bebas Biaya</span>
                      </div>
                    `;
                  } else if (isPaid) {
                    badgeHtml = `<span class="badge badge-success">✓ Lunas (${sppStatus.record?.method || 'Tunai'})</span>`;
                    actionButtons = `
                      <div class="cell-actions" style="display: flex; gap: 6px; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                          🔗
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-icon-only" onclick="app.showReceiptById('${sppStatus.record.id}')" title="Cetak Kuitansi Struk">
                          🧾
                        </button>
                        <button type="button" class="btn btn-whatsapp btn-sm btn-icon-only" onclick="app.openReceiptWaPreview('${s.id}', '${sppStatus.record.id}')" title="Kirim WA Kuitansi">
                          📲
                        </button>
                        <button type="button" class="btn btn-danger btn-sm btn-icon-only" onclick="app.cancelSppPaymentPrompt('${sppStatus.record.id}')" title="Batalkan Pelunasan">
                          ↩️
                        </button>
                      </div>
                    `;
                  } else {
                    badgeHtml = `<span class="badge badge-danger">✕ Belum Lunas</span>`;
                    actionButtons = `
                      <div class="cell-actions" style="display: flex; gap: 6px; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                          🔗
                        </button>
                        <button type="button" class="btn btn-primary btn-sm btn-icon-only" onclick="app.openPaySppModal('${s.id}', '${selectedMonth}')" title="Catat Pembayaran SPP">
                          💳
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-icon-only" onclick="app.openReminderWaPreview('${s.id}', '${selectedMonth}')" title="Kirim Tagihan Pengingat WA">
                          💬
                        </button>
                      </div>
                    `;
                  }

                  return `
                    <tr>
                      <td style="font-weight: 700; color: var(--slate-500);">${s.nis}</td>
                      <td>
                        <div style="font-weight: 700; color: var(--slate-900); font-size: 0.88rem;">${s.name}</div>
                      </td>
                      <td>
                        <div style="font-size: 0.82rem; font-weight: 600; color: var(--slate-700);">${s.parent}</div>
                        <div style="font-size: 0.72rem; color: var(--slate-400);">${s.phone}</div>
                      </td>
                      <td style="font-weight: 700; color: var(--slate-800);">${this.formatRp(s.sppAmount)}</td>
                      <td>${badgeHtml}</td>
                      <td style="text-align: right;">${actionButtons}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      outputHtml += `
        <div class="spp-class-card" id="spp-class-card-${c.id}">
          <div class="spp-class-header">
            <div class="spp-class-title-group">
              <div class="spp-class-icon">${c.icon}</div>
              <div>
                <h4>${c.name}</h4>
                <div class="spp-class-teacher">👤 Pengampu: <strong>${c.teacher}</strong> &nbsp;•&nbsp; 📍 ${c.room} &nbsp;•&nbsp; ⏰ ${c.schedule}</div>
              </div>
            </div>
            <div class="spp-class-header-actions">
              <div class="spp-class-kpis">
                <span class="kpi-pill kpi-total">👥 ${enrolledStudents.length} Santri</span>
                <span class="kpi-pill kpi-paid">✓ ${clsPaid} Lunas</span>
                ${clsUnpaid > 0 ? `<span class="kpi-pill kpi-unpaid">✕ ${clsUnpaid} Belum</span>` : ''}
                ${clsScholar > 0 ? `<span class="kpi-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">⭐ ${clsScholar} Beasiswa</span>` : ''}
                <span class="kpi-pill" style="background: var(--slate-100); color: var(--primary-700); font-weight: 700;">💰 ${this.formatRp(clsCollected)}</span>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm" onclick="app.openEditClassModal('${c.id}')" title="Ubah Nama & Rincian ${c.shortName}">
                <span>✏️ Ubah Nama Kelas</span>
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm btn-add-class-std" onclick="app.openStudentModal('${c.id}')" title="Daftarkan santri ke ${c.shortName}">
                <span>➕ Tambah Santri</span>
              </button>
            </div>
          </div>
          <div class="spp-class-body">
            ${bodyContentHtml}
          </div>
        </div>
      `;
    });

    wrapper.innerHTML = outputHtml;

    const summaryEl = document.getElementById('spp-filter-summary');
    if (summaryEl) {
      summaryEl.innerText = `Menampilkan ${totalRenderedCount} Santri • ${this.formatMonthId(selectedMonth)}`;
    }
  }

  // Buka Modal Bayar SPP
  openPaySppModal(studentId, monthStr) {
    const student = window.db.getStudent(studentId);
    if (!student) return;

    const targetMonth = monthStr || document.getElementById('filter-spp-month')?.value || this.getCurrentMonthStr();

    this.removeSppProof();
    document.getElementById('pay-student-id').value = student.id;
    document.getElementById('pay-student-name').value = `${student.name} (${student.class})`;
    document.getElementById('pay-spp-month').value = this.formatMonthId(targetMonth);
    document.getElementById('pay-spp-amount').value = student.sppAmount;
    
    // Store raw month in form dataset
    document.getElementById('form-pay-spp').dataset.rawMonth = targetMonth;

    this.openModal('modal-pay-spp');
  }

  submitPaySpp(e) {
    e.preventDefault();
    const studentId = document.getElementById('pay-student-id').value;
    const monthStr = document.getElementById('form-pay-spp').dataset.rawMonth;
    const amount = Number(document.getElementById('pay-spp-amount').value);
    const method = document.getElementById('pay-spp-method').value;
    const proofImage = this.uploadedSppProof;

    const record = window.db.paySpp(studentId, monthStr, amount, method, null, proofImage);
    this.removeSppProof();
    this.closeModal('modal-pay-spp');
    
    // Update Views
    this.renderAll();

    // Show Kwitansi Modal
    const student = window.db.getStudent(studentId);
    this.showReceipt(record, student);
  }

  // Tampilkan Kwitansi
  showReceipt(record, student) {
    this.currentReceipt = { record, student };

    const tpaInfo = window.db.getTPAInfo();
    const rcpTpaEl = document.getElementById('rcp-tpa-name');
    if (rcpTpaEl && tpaInfo) rcpTpaEl.innerText = (tpaInfo.nama || 'TPA').toUpperCase();

    document.getElementById('rcp-number').innerText = `No: ${record.receiptNo}`;
    document.getElementById('rcp-date').innerText = this.formatDateId(record.paidDate);
    document.getElementById('rcp-parent').innerText = student.parent;
    document.getElementById('rcp-student').innerText = student.name;
    document.getElementById('rcp-class').innerText = student.class;
    document.getElementById('rcp-for').innerText = `Syahriah / SPP Bulan ${this.formatMonthId(record.month)}`;
    document.getElementById('rcp-method').innerText = record.method;
    document.getElementById('rcp-amount').innerText = this.formatRp(record.amount);

    const btnWa = document.getElementById('btn-rcp-send-wa');
    if (btnWa) {
      btnWa.onclick = () => this.openReceiptWaPreview(student.id, record.id);
    }

    const btnCancel = document.getElementById('btn-rcp-cancel');
    if (btnCancel) {
      btnCancel.onclick = () => this.cancelSppPaymentPrompt(record.id);
    }

    const btnProof = document.getElementById('btn-rcp-view-proof');
    if (btnProof) {
      btnProof.style.display = record.proofImage ? 'inline-block' : 'none';
    }

    // Pre-generate HD receipt image in background so it's instantly ready
    this.generateReceiptImage(record, student);

    this.openModal('modal-receipt');
  }

  showReceiptById(recordId) {
    const record = window.db.data.sppRecords.find(r => r.id === recordId);
    if (!record) return;
    const student = window.db.getStudent(record.studentId);
    this.showReceipt(record, student);
  }

  cancelSppPaymentPrompt(recordId) {
    const record = window.db.data.sppRecords.find(r => r.id === recordId);
    if (!record) return;
    const student = window.db.getStudent(record.studentId);
    const studentName = student ? student.name : 'Santri';

    if (confirm(`Batalkan pelunasan SPP Bulan ${this.formatMonthId(record.month)} untuk ${studentName}?\n\nStatus santri akan kembali menjadi 'Belum Lunas' dan saldo kas operasional akan disesuaikan.`)) {
      window.db.deleteSppRecord(recordId);
      this.closeModal('modal-receipt');
      this.renderAll();
      this.showToast(`Pembayaran SPP untuk ${studentName} berhasil dibatalkan.`);
    }
  }

  // =========================================================================
  // HIGH-RESOLUTION DIGITAL RECEIPT IMAGE GENERATOR (CANVAS TO PNG)
  // =========================================================================
  generateReceiptImage(record, student) {
    return new Promise((resolve) => {
      const tpaInfo = window.db.getTPAInfo();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Scale 2x for Retina sharpness (1280 x 1840 px)
      const scale = 2;
      const width = 640;
      const height = 920;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background Card
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Subtle Outer Frame
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Top Header Gradient Bar
      const grad = ctx.createLinearGradient(10, 10, width - 10, 10);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(12, 12, width - 24, 7);

      const drawContent = (logoImg = null) => {
        const startY = 48;

        // Draw Logo or Fallback Emblem Badge
        if (logoImg) {
          try {
            ctx.drawImage(logoImg, 36, startY, 52, 52);
          } catch (e) {
            this.drawDefaultLogoEmblem(ctx, 36, startY);
          }
        } else {
          this.drawDefaultLogoEmblem(ctx, 36, startY);
        }

        // Institution Header Info
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Plus Jakarta Sans", -apple-system, Roboto, sans-serif';
        const institutionName = (tpaInfo.nama || 'RQ UMMUL QOSIM').toUpperCase();
        ctx.fillText(institutionName, 100, startY + 20);

        ctx.fillStyle = '#475569';
        ctx.font = '600 13px sans-serif';
        ctx.fillText(tpaInfo.masjid || 'Lembaga Pendidikan Al-Qur\'an', 100, startY + 38);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        const fullAddr = `${tpaInfo.alamat || ''} • Telp: ${tpaInfo.kontak || '-'}`;
        ctx.fillText(fullAddr.length > 56 ? fullAddr.slice(0, 53) + '...' : fullAddr, 100, startY + 54);

        // Perforated Dashed Divider
        const lineY = startY + 74;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(32, lineY);
        ctx.lineTo(width - 32, lineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Receipt Title Pill
        const titleY = lineY + 32;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(32, titleY - 18, width - 64, 36, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12.5px sans-serif';
        ctx.fillText('BUKTI TANDA TERIMA PEMBAYARAN SYAHRIAH (SPP) RESMI', width / 2, titleY + 4);

        // Meta (No Kwitansi & Tanggal)
        const metaY = titleY + 36;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`No. Kwitansi: ${record.receiptNo}`, 36, metaY);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#475569';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Tanggal: ${this.formatDateId(record.paidDate)}`, width - 36, metaY);

        // Information Grid Box
        const boxY = metaY + 16;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(32, boxY, width - 64, 224, 10);
        ctx.fill();
        ctx.stroke();

        const rows = [
          { label: 'Nama Santri', val: student.name, isBold: true },
          { label: 'NIS / Kelas', val: `${student.nis || '-'}  •  ${student.class}`, isBold: false },
          { label: 'Diterima Dari', val: student.parent, isBold: false },
          { label: 'Keterangan', val: `Syahriah / SPP Bulan ${this.formatMonthId(record.month)}`, isBold: true },
          { label: 'Metode Pembayaran', val: record.method || 'Tunai', isBold: false },
          { label: 'Status Verifikasi', val: 'LUNAS (Alhamdulillah)', isBold: true, isGreen: true }
        ];

        let rowY = boxY + 32;
        rows.forEach(r => {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#64748b';
          ctx.font = '13px sans-serif';
          ctx.fillText(r.label, 52, rowY);

          ctx.textAlign = 'right';
          if (r.isGreen) {
            ctx.fillStyle = '#059669';
          } else if (r.isBold) {
            ctx.fillStyle = '#0f172a';
          } else {
            ctx.fillStyle = '#334155';
          }
          ctx.font = r.isBold ? 'bold 13px sans-serif' : '13px sans-serif';
          ctx.fillText(r.val, width - 52, rowY);

          rowY += 32;
        });

        // Total Highlight Box (Emerald Green Gradient Pill)
        const totalBoxY = boxY + 238;
        const totalGrad = ctx.createLinearGradient(32, totalBoxY, width - 32, totalBoxY);
        totalGrad.addColorStop(0, '#ecfdf5');
        totalGrad.addColorStop(1, '#d1fae5');
        ctx.fillStyle = totalGrad;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(32, totalBoxY, width - 64, 66, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('TOTAL DITERIMA (LUNAS):', 52, totalBoxY + 39);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(this.formatRp(record.amount), width - 52, totalBoxY + 42);

        // Verification Stamp (Slanted Rotated Stamp)
        const stampX = 145;
        const stampY = totalBoxY + 124;
        ctx.save();
        ctx.translate(stampX, stampY);
        ctx.rotate(-11 * Math.PI / 180);

        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 86, 34, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 28, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('✓ LUNAS SYAHRIAH', 0, -4);

        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = '#047857';
        ctx.fillText('VERIFIED DIGITAL RECORD', 0, 12);
        ctx.restore();

        // Barcode lines on the right
        const barcodeX = width - 188;
        const barcodeY = totalBoxY + 104;
        ctx.fillStyle = '#0f172a';
        const barPattern = [3, 2, 5, 2, 2, 4, 2, 5, 3, 2, 4, 3, 2, 5, 2, 3, 4, 2, 3];
        let currBarX = barcodeX;
        barPattern.forEach((w, i) => {
          if (i % 2 === 0) {
            ctx.fillRect(currBarX, barcodeY, w, 32);
          }
          currBarX += w + 2;
        });

        ctx.textAlign = 'center';
        ctx.font = '9.5px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(record.receiptNo, barcodeX + 58, barcodeY + 44);

        // Footer Doa
        const footerY = totalBoxY + 184;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 12px sans-serif';
        ctx.fillText('Jazakumullah Khairan Katsiran', width / 2, footerY);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Semoga berkah dan menjadi amal jariyah bagi keluarga ananda.', width / 2, footerY + 18);

        // Signatures
        const signY = footerY + 48;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = '11px sans-serif';
        ctx.fillText('Wali Santri,', 52, signY);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`( ${student.parent} )`, 52, signY + 36);

        ctx.textAlign = 'right';
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Bendahara RQ,', width - 52, signY);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`( ${tpaInfo.bendahara} )`, width - 52, signY + 36);

        // Bottom Watermark
        ctx.textAlign = 'center';
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Digenerate Resmi melalui ${tpaInfo.appName || 'SikadTPA Keuangan'} • ${new Date().getFullYear()}`, width / 2, height - 18);

        // Convert to DataURL and Blob
        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((blob) => {
          this.currentReceiptDataUrl = dataUrl;
          this.currentReceiptBlob = blob;
          resolve({ dataUrl, blob });
        }, 'image/png');
      };

      if (tpaInfo.appLogo) {
        const img = new Image();
        img.onload = () => drawContent(img);
        img.onerror = () => drawContent(null);
        img.src = tpaInfo.appLogo;
      } else {
        drawContent(null);
      }
    });
  }

  drawDefaultLogoEmblem(ctx, x, y) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(x, y, 52, 52, 12);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RQ', x + 26, y + 33);
  }

  // Simulated WhatsApp Preview Window
  openWaPreviewModal(name, phone, message) {
    this.currentWaMsg = message;
    this.currentWaPhone = phone;

    const elName = document.getElementById('wa-preview-name');
    if (elName) elName.innerText = name;

    const elPhone = document.getElementById('wa-preview-phone');
    if (elPhone) elPhone.innerText = phone;

    const elBubble = document.getElementById('wa-preview-bubble-text');
    if (elBubble) {
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      elBubble.innerHTML = message.replace(/\n/g, '<br>') + `<div class="wa-bubble-time" id="wa-preview-time">${nowTime} ✓✓</div>`;
    }

    const elAvatar = document.getElementById('wa-preview-avatar');
    if (elAvatar) {
      elAvatar.innerText = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const directBtn = document.getElementById('btn-wa-launch-direct');
    if (directBtn) {
      directBtn.href = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
    }

    this.openModal('modal-wa-preview');
  }

  copyWaPreviewText() {
    if (!this.currentWaMsg) return;
    navigator.clipboard.writeText(this.currentWaMsg).then(() => {
      this.showToast('📋 Teks pesan WhatsApp berhasil disalin!');
    }).catch(() => {
      this.showToast('Pesan siap digunakan.');
    });
  }

  // WhatsApp Integration: Kirim Pengingat SPP (Teks Only)
  openReminderWaPreview(studentId, monthStr) {
    const student = window.db.getStudent(studentId);
    const tpaInfo = window.db.getTPAInfo();
    if (!student) return;

    // Sembunyikan preview gambar kwitansi dan action grid khusus kwitansi
    const imgBox = document.getElementById('wa-receipt-img-box');
    const actionsGrid = document.getElementById('wa-receipt-actions');
    if (imgBox) imgBox.style.display = 'none';
    if (actionsGrid) actionsGrid.style.display = 'none';

    const monthFormatted = this.formatMonthId(monthStr);
    const message = 
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Bapak/Ibu Wali dari Ananda *${student.name}* (${student.class}),

Semoga Bapak/Ibu sekeluarga senantiasa dalam limpahan berkah dan kesehatan dari Allah SWT.

Kami dari bagian administrasi & keuangan *${tpaInfo.nama}* menginformasikan mengenai kewajiban syahriah/SPP santri untuk bulan *${monthFormatted}* sebesar *${this.formatRp(student.sppAmount)}* yang saat ini belum tercatat lunas.

Pembayaran dapat ditunaikan melalui:
1. Tunai ke Bendahara di kantor TPA (${tpaInfo.bendahara})
2. Transfer Bank: *${tpaInfo.rekening}*

Konfirmasi pembayaran dapat dikirimkan ke nomor ini. Jazakumullah khairan katsiran atas kerja sama dan dukungan Bapak/Ibu demi kelancaran kegiatan belajar mengajar Al-Qur'an ananda.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
— Pengurus *${tpaInfo.nama}*`;

    this.openWaPreviewModal(student.parent, student.phone, message);
  }

  // WhatsApp Integration: Kirim Bukti Kwitansi Lunas (DENGAN GAMBAR KWITANSI HD)
  openReceiptWaPreview(studentId, recordId) {
    const student = window.db.getStudent(studentId);
    const record = window.db.data.sppRecords.find(r => r.id === recordId);
    const tpaInfo = window.db.getTPAInfo();
    if (!student || !record) return;

    this.currentReceipt = { record, student };

    const message = 
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

*BUKTI PEMBAYARAN SYAHRIAH (SPP) TPA*
━━━━━━━━━━━━━━━━━━━━
Lembaga: *${tpaInfo.nama}*
No. Kwitansi: *${record.receiptNo}*
Tanggal: ${this.formatDateId(record.paidDate)}
━━━━━━━━━━━━━━━━━━━━
Nama Santri : *${student.name}*
Kelas/Jilid : ${student.class}
Diterima Dari: ${student.parent}
Untuk Bulan : *${this.formatMonthId(record.month)}*
Jumlah      : *${this.formatRp(record.amount)}*
Metode Bayar: ${record.method}
Status      : *LUNAS ✓*
━━━━━━━━━━━━━━━━━━━━

Alhamdulillah, pembayaran telah kami terima dan tercatat dalam kas operasional TPA. Jazakumullah khairan katsiran, semoga Allah melipatgandakan rezeki dan ananda dimudahkan dalam menuntut ilmu Al-Qur'an. Aamiin.

Hormat kami,
Bendahara *${tpaInfo.nama}*
(${tpaInfo.bendahara})`;

    // Generate dan pasang gambar kwitansi ke chat bubble simulasi
    this.generateReceiptImage(record, student).then(({ dataUrl }) => {
      const imgBox = document.getElementById('wa-receipt-img-box');
      const previewImg = document.getElementById('wa-receipt-preview-image');
      const actionsGrid = document.getElementById('wa-receipt-actions');

      if (imgBox && previewImg) {
        previewImg.src = dataUrl;
        imgBox.style.display = 'block';
      }
      if (actionsGrid) {
        actionsGrid.style.display = 'grid';
      }

      this.openWaPreviewModal(student.parent, student.phone, message);
    });
  }

  // =========================================================================
  // AKSI PENGIRIMAN GAMBAR KWITANSI (SHARE HP, CLIPBOARD, DOWNLOAD)
  // =========================================================================
  shareReceiptImageMobile() {
    if (!this.currentReceiptBlob || !this.currentReceipt) {
      this.showToast('Gambar kwitansi sedang disiapkan...');
      return;
    }
    const student = this.currentReceipt.student;
    const record = this.currentReceipt.record;
    const fileName = `Kwitansi_SPP_${student.name.replace(/\s+/g, '_')}_${record.month}.png`;
    const file = new File([this.currentReceiptBlob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: `Kwitansi SPP ${student.name}`,
        text: this.currentWaMsg,
        files: [file]
      }).then(() => {
        this.showToast('✅ Kwitansi gambar berhasil dikirim!');
      }).catch((e) => {
        if (e.name !== 'AbortError') {
          this.copyReceiptImageToClipboard();
        }
      });
    } else {
      // Fallback ramah untuk Desktop/Laptop
      this.copyReceiptImageToClipboard();
      this.downloadReceiptImage();
      alert("Di PC/Laptop: Gambar kwitansi sudah otomatis disalin ke Clipboard dan diunduh.\n\nSilakan klik 'Buka WhatsApp Langsung' lalu tekan Ctrl + V pada chat WhatsApp wali santri.");
    }
  }

  copyReceiptImageToClipboard() {
    if (!this.currentReceiptBlob) {
      this.showToast('Gambar kwitansi belum siap.');
      return;
    }

    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': this.currentReceiptBlob })
      ]).then(() => {
        this.showToast('📸 Foto kwitansi berhasil disalin! Silakan tekan Ctrl+V di WhatsApp.');
      }).catch(() => {
        this.downloadReceiptImage();
        this.showToast('Foto kwitansi diunduh ke galeri/komputer.');
      });
    } else {
      this.downloadReceiptImage();
      this.showToast('Foto kwitansi diunduh ke komputer.');
    }
  }

  downloadReceiptImage() {
    if (!this.currentReceiptDataUrl || !this.currentReceipt) return;
    const student = this.currentReceipt.student;
    const record = this.currentReceipt.record;
    const a = document.createElement('a');
    a.href = this.currentReceiptDataUrl;
    a.download = `Kwitansi_SPP_${student.name.replace(/\s+/g, '_')}_${record.month}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast('⬇️ Foto kwitansi berhasil diunduh!');
  }

  downloadCurrentReceiptImage() {
    this.downloadReceiptImage();
  }

  viewFullReceiptImage() {
    if (!this.currentReceiptDataUrl) return;
    const viewerSrc = document.getElementById('image-viewer-src');
    const viewerTitle = document.getElementById('image-viewer-title');
    const downloadBtn = document.getElementById('image-viewer-download-btn');

    if (viewerSrc) viewerSrc.src = this.currentReceiptDataUrl;
    if (viewerTitle) viewerTitle.innerText = 'Pratinjau Kwitansi Digital Resmi (HD)';
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadReceiptImage();
    }
    this.openModal('modal-image-viewer');
  }

  viewCurrentProofImage() {
    if (!this.currentReceipt || !this.currentReceipt.record || !this.currentReceipt.record.proofImage) {
      this.showToast('Tidak ada foto bukti transfer terlampir.');
      return;
    }
    const viewerSrc = document.getElementById('image-viewer-src');
    const viewerTitle = document.getElementById('image-viewer-title');
    const downloadBtn = document.getElementById('image-viewer-download-btn');

    if (viewerSrc) viewerSrc.src = this.currentReceipt.record.proofImage;
    if (viewerTitle) viewerTitle.innerText = 'Foto Bukti Pembayaran / Struk Fisik';
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = this.currentReceipt.record.proofImage;
        a.download = `Bukti_Bayar_${this.currentReceipt.record.receiptNo}.png`;
        a.click();
      };
    }
    this.openModal('modal-image-viewer');
  }

  // =========================================================================
  // HANDLER UPLOAD LOGO, QRIS, DAN FOTO BUKTI PEMBAYARAN
  // =========================================================================
  handleAppLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.compressImage(e.target.result, 400, 400, 0.9, (base64) => {
        this.uploadedAppLogo = base64;
        const previewBox = document.getElementById('info-app-logo-preview-box');
        const previewImg = document.getElementById('info-app-logo-preview');
        if (previewImg) previewImg.src = base64;
        if (previewBox) previewBox.style.display = 'flex';
        this.showToast('🎨 Logo berhasil dipilih! Klik Simpan Pengaturan di bawah.');
      });
    };
    reader.readAsDataURL(file);
  }

  resetAppLogo() {
    this.uploadedAppLogo = "";
    const previewBox = document.getElementById('info-app-logo-preview-box');
    const input = document.getElementById('info-app-logo');
    if (input) input.value = '';
    if (previewBox) previewBox.style.display = 'none';
    this.showToast('Logo direset ke ikon bawaan. Jangan lupa klik Simpan Pengaturan.');
  }

  handleQrisUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.compressImage(e.target.result, 600, 600, 0.92, (base64) => {
        this.uploadedQrisImage = base64;
        const previewBox = document.getElementById('info-qris-preview-box');
        const previewImg = document.getElementById('info-qris-preview');
        if (previewImg) previewImg.src = base64;
        if (previewBox) previewBox.style.display = 'flex';
        this.showToast('📱 Foto QRIS berhasil dipilih! Klik Simpan Pengaturan di bawah.');
      });
    };
    reader.readAsDataURL(file);
  }

  resetQrisImage() {
    this.uploadedQrisImage = "";
    const previewBox = document.getElementById('info-qris-preview-box');
    const input = document.getElementById('info-qris-file');
    if (input) input.value = '';
    if (previewBox) previewBox.style.display = 'none';
    this.showToast('QRIS direset ke contoh bawaan. Jangan lupa klik Simpan Pengaturan.');
  }

  handleSppProofUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.compressImage(e.target.result, 800, 800, 0.85, (base64) => {
        this.uploadedSppProof = base64;
        const box = document.getElementById('pay-proof-preview-box');
        const img = document.getElementById('pay-proof-img');
        if (img) img.src = base64;
        if (box) box.style.display = 'flex';
      });
    };
    reader.readAsDataURL(file);
  }

  removeSppProof() {
    this.uploadedSppProof = null;
    const input = document.getElementById('pay-spp-proof');
    const box = document.getElementById('pay-proof-preview-box');
    if (input) input.value = '';
    if (box) box.style.display = 'none';
  }

  downloadQrisImage() {
    const info = window.db.getTPAInfo();
    if (info.qrisUrl) {
      const a = document.createElement('a');
      a.href = info.qrisUrl;
      a.download = `QRIS_${(info.nama || 'TPA').replace(/\s+/g, '_')}.png`;
      a.click();
      this.showToast('Foto QRIS berhasil diunduh!');
    } else {
      alert('Anda belum mengunggah gambar QRIS asli lembaga. Silakan unggah di menu Master > Informasi Lembaga.');
    }
  }

  compressImage(base64Data, maxW, maxH, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        if (w > h) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        } else {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/png', quality));
    };
    img.src = base64Data;
  }

  broadcastSppReminder() {
    const unpaidCount = document.getElementById('count-capsule-unpaid')?.innerText || '4';
    alert(`Format Pengingat WhatsApp otomatis aktif!\nTerdapat ${unpaidCount} santri dengan tunggakan SPP. Klik tombol '💬 Pengingat WA' pada setiap kartu santri untuk menampilkan preview chat WhatsApp siap kirim.`);
  }

  // =========================================================================
  // 3. MODUL TABUNGAN SANTRI
  // =========================================================================
  renderSavings() {
    const studentsBody = document.getElementById('savings-students-body');
    const historyBody = document.getElementById('savings-history-body');
    const totalBalanceEl = document.getElementById('savings-total-balance');
    const searchQuery = (document.getElementById('filter-savings-search')?.value || '').toLowerCase().trim();

    const wallet = window.db.getWallet('tabungan');
    if (totalBalanceEl && wallet) {
      totalBalanceEl.innerText = this.formatRp(wallet.balance);
    }

    let students = window.db.getStudents();
    if (searchQuery) {
      students = students.filter(s => s.name.toLowerCase().includes(searchQuery) || s.class.toLowerCase().includes(searchQuery));
    }

    if (studentsBody) {
      studentsBody.innerHTML = students.map(s => `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--slate-900);">${s.name}</div>
            <div style="font-size: 0.72rem; color: var(--slate-400);">${s.parent}</div>
          </td>
          <td><span class="badge badge-neutral">${s.class}</span></td>
          <td style="font-weight: 800; color: var(--primary-700);">${this.formatRp(s.savingsBalance)}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-primary btn-sm" onclick="app.openSavingsModal('Setor', '${s.id}')">
                ➕ Setor
              </button>
              <button class="btn btn-warning btn-sm" onclick="app.openSavingsModal('Tarik', '${s.id}')">
                ➖ Tarik
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // 5 Mutasi Terakhir Tabungan
    const txs = window.db.getSavingsTransactions().slice(0, 5);
    if (historyBody) {
      if (txs.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--slate-400); padding: 16px;">Belum ada mutasi tabungan.</td></tr>`;
      } else {
        historyBody.innerHTML = txs.map(t => {
          const student = window.db.getStudent(t.studentId);
          const isDeposit = t.type === 'Setor';
          return `
            <tr>
              <td>${this.formatDateId(t.date)}</td>
              <td style="font-weight: 600;">${student ? student.name : '-'}</td>
              <td>
                <span class="badge ${isDeposit ? 'badge-success' : 'badge-warning'}">${t.type}</span>
              </td>
              <td style="font-weight: 700; color: ${isDeposit ? 'var(--primary-700)' : 'var(--gold-700)'};">
                ${isDeposit ? '+' : '-'}${this.formatRp(t.amount)}
              </td>
              <td style="font-size: 0.75rem; color: var(--slate-500);">${t.note}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  openSavingsModal(actionType = 'Setor', studentId = null) {
    const actTypeEl = document.getElementById('savings-action-type');
    if (actTypeEl) actTypeEl.value = actionType;
    const titleEl = document.getElementById('savings-modal-title');
    if (titleEl) titleEl.innerText = `${actionType} Tabungan Santri`;

    const selectEl = document.getElementById('savings-student-select');
    const students = window.db.getStudents();
    selectEl.innerHTML = students.map(s => `
      <option value="${s.id}" ${studentId === s.id ? 'selected' : ''}>${s.name} (${s.class}) - Saldo: ${this.formatRp(s.savingsBalance)}</option>
    `).join('');

    document.getElementById('savings-amount').value = '';
    document.getElementById('savings-note').value = actionType === 'Setor' ? 'Tabungan pekanan' : 'Kebutuhan wisuda/buku';

    this.openModal('modal-savings');
  }

  submitSavings(e) {
    e.preventDefault();
    const type = document.getElementById('savings-action-type').value;
    const studentId = document.getElementById('savings-student-select').value;
    const amount = Number(document.getElementById('savings-amount').value);
    const note = document.getElementById('savings-note').value;

    try {
      window.db.addSavingsTransaction(studentId, type, amount, note);
      this.closeModal('modal-savings');
      this.renderAll();
      alert(`Berhasil mencatat ${type} Tabungan sebesar ${this.formatRp(amount)}!`);
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // 4. MODUL INFAQ & DONASI
  // =========================================================================
  renderInfaq() {
    const infaqWallet = window.db.getWallet('infaq');
    const bangunWallet = window.db.getWallet('bangun');
    const infaqBalEl = document.getElementById('infaq-wallet-balance');
    const bangunBalEl = document.getElementById('bangun-wallet-balance');
    if (infaqWallet && infaqBalEl) infaqBalEl.innerText = this.formatRp(infaqWallet.balance);
    if (bangunWallet && bangunBalEl) bangunBalEl.innerText = this.formatRp(bangunWallet.balance);

    const tbody = document.getElementById('infaq-table-body');
    if (!tbody) return;

    const txs = window.db.getTransactions().filter(t => t.type === 'in' && (t.walletId === 'infaq' || t.walletId === 'bangun'));
    if (txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">Belum ada catatan infaq.</td></tr>`;
      return;
    }

    const walletLabels = {
      infaq: '<span class="badge badge-warning">Kas Infaq & Sedekah</span>',
      bangun: '<span class="badge" style="background: #f3e8ff; color: #7c3aed;">Kas Pembangunan</span>'
    };

    tbody.innerHTML = txs.map(t => `
      <tr>
        <td>${this.formatDateId(t.date)}</td>
        <td>${walletLabels[t.walletId] || t.walletId}</td>
        <td style="font-weight: 700; color: var(--slate-800);">${t.category}</td>
        <td style="font-weight: 800; color: var(--primary-700);">${this.formatRp(t.amount)}</td>
        <td style="font-size: 0.8rem; color: var(--slate-600);">${t.desc}</td>
        <td style="font-size: 0.72rem; color: var(--slate-400);">${t.ref}</td>
      </tr>
    `).join('');
  }

  openInfaqModal() {
    this.openTxModal('in', 'infaq');
    document.getElementById('tx-category').value = 'Kotak Infaq Santri';
  }

  openQRISModal() {
    this.openModal('modal-qris');
  }

  // =========================================================================
  // 5. MODUL BISYARAH & PENGELUARAN
  // =========================================================================
  renderExpenses() {
    // Render Teachers
    const teachersBody = document.getElementById('teachers-table-body');
    if (teachersBody) {
      const teachers = window.db.getTeachers();
      teachersBody.innerHTML = teachers.map(t => `
        <tr>
          <td style="font-weight: 700; color: var(--slate-500);">${t.id}</td>
          <td>
            <div style="font-weight: 700; color: var(--slate-900);">${t.name}</div>
          </td>
          <td><span class="badge badge-info">${t.role}</span></td>
          <td style="font-size: 0.8rem;">${t.phone}</td>
          <td style="font-weight: 600;">${t.sessions} Sesi</td>
          <td style="font-weight: 800; color: var(--primary-700);">${this.formatRp(t.baseSalary)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
              <button class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.openTeacherModal('${t.id}')" title="Ubah Nama & Data Ustadz">
                ✏️
              </button>
              <button class="btn btn-primary btn-sm btn-icon-only" onclick="app.payTeacherBisyarahPrompt('${t.id}')" title="Bayar Bisyarah Ustadz">
                💵
              </button>
              <button class="btn btn-danger btn-sm btn-icon-only" onclick="app.deleteTeacher('${t.id}')" title="Hapus Data Pengajar">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Render Operasional Expenses
    const expensesBody = document.getElementById('expenses-table-body');
    if (expensesBody) {
      const txs = window.db.getTransactions().filter(t => t.type === 'out');
      if (txs.length === 0) {
        expensesBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">Belum ada pengeluaran tercatat.</td></tr>`;
      } else {
        const walletNames = {
          ops: 'Kas Operasional',
          tabungan: 'Kas Tabungan',
          infaq: 'Kas Infaq',
          bangun: 'Kas Pembangunan'
        };

        expensesBody.innerHTML = txs.map(t => `
          <tr>
            <td>${this.formatDateId(t.date)}</td>
            <td><span class="badge badge-neutral">${walletNames[t.walletId] || t.walletId}</span></td>
            <td style="font-weight: 700; color: var(--danger);">${t.category}</td>
            <td style="font-weight: 800; color: var(--danger);">${this.formatRp(t.amount)}</td>
            <td style="font-size: 0.8rem; color: var(--slate-600);">${t.desc}</td>
            <td style="font-size: 0.72rem; color: var(--slate-400);">${t.ref}</td>
          </tr>
        `).join('');
      }
    }
  }

  payTeacherBisyarahPrompt(teacherId) {
    const teacher = window.db.getTeachers().find(t => t.id === teacherId);
    if (!teacher) return;

    const curMonth = this.getCurrentMonthStr();
    const curMonthName = this.formatMonthId(curMonth);
    const confirmMsg = `Konfirmasi pembayaran Bisyarah untuk:\nNama: ${teacher.name}\nTugas: ${teacher.role}\nJumlah: ${this.formatRp(teacher.baseSalary)}\nPeriode: ${curMonthName}\n\nDana akan dikurangi dari Kas Operasional. Lanjutkan?`;
    if (confirm(confirmMsg)) {
      try {
        const result = window.db.payBisyarah(teacherId, curMonth, teacher.baseSalary, `Bisyarah mengajar periode ${curMonthName}`);
        this.renderAll();
        alert(`Alhamdulillah, Bisyarah untuk ${teacher.name} sebesar ${this.formatRp(teacher.baseSalary)} berhasil dicatat! (Ref: ${result.refNo})`);
      } catch (e) {
        alert(e.message);
      }
    }
  }

  openExpenseModal() {
    this.openTxModal('out', 'ops');
    document.getElementById('tx-category').value = 'Operasional ATK / Modul';
  }

  // =========================================================================
  // 6. MODUL LAPORAN RESMI SIAP CETAK
  // =========================================================================
  generateReport() {
    const period = document.getElementById('report-period-select')?.value || this.getCurrentMonthStr();
    const tpaInfo = window.db.getTPAInfo();
    const wallets = window.db.getWallets();

    // Set Kop Surat
    const repName = document.getElementById('rep-tpa-name');
    if (repName) repName.innerText = tpaInfo.nama;
    const repMasjid = document.getElementById('rep-tpa-masjid');
    if (repMasjid) repMasjid.innerText = tpaInfo.masjid;
    const repAddress = document.getElementById('rep-tpa-address');
    if (repAddress) repAddress.innerText = `${tpaInfo.alamat} • Kontak: ${tpaInfo.kontak} • Rekening: ${tpaInfo.rekening}`;
    const repKetua = document.getElementById('rep-sign-ketua');
    if (repKetua) repKetua.innerText = tpaInfo.ketua;
    const repBendahara = document.getElementById('rep-sign-bendahara');
    if (repBendahara) repBendahara.innerText = tpaInfo.bendahara;
    const repDate = document.getElementById('rep-sign-date');
    if (repDate) repDate.innerText = this.formatDateId(new Date().toISOString().split('T')[0]);

    const repSubtitle = document.getElementById('rep-subtitle');
    if (repSubtitle) {
      if (period === 'all') {
        repSubtitle.innerText = 'Periode: Semua Riwayat Transaksi';
      } else {
        repSubtitle.innerText = `Periode: ${this.formatMonthId(period)}`;
      }
    }

    // Wallets Summary Cards
    const walletsSummaryEl = document.getElementById('rep-wallets-summary');
    if (walletsSummaryEl) {
      walletsSummaryEl.innerHTML = wallets.map(w => `
        <div style="background: var(--slate-50); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; text-align: center;">
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--slate-600);">${w.name}</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--slate-900); margin-top: 4px;">${this.formatRp(w.balance)}</div>
        </div>
      `).join('');
    }

    // Filter transactions by period
    let txs = window.db.getTransactions();
    if (period !== 'all') {
      txs = txs.filter(t => t.date.startsWith(period));
    }

    let totalIn = 0;
    let totalOut = 0;

    txs.forEach(t => {
      if (t.type === 'in') totalIn += t.amount;
      if (t.type === 'out') totalOut += t.amount;
    });

    const netFlow = totalIn - totalOut;

    const repTotalIn = document.getElementById('rep-total-in');
    if (repTotalIn) repTotalIn.innerText = this.formatRp(totalIn);
    const repTotalOut = document.getElementById('rep-total-out');
    if (repTotalOut) repTotalOut.innerText = this.formatRp(totalOut);
    
    const netFlowEl = document.getElementById('rep-net-flow');
    if (netFlowEl) {
      netFlowEl.innerText = this.formatRp(netFlow);
      netFlowEl.style.color = netFlow >= 0 ? 'var(--primary-700)' : 'var(--danger)';
    }

    // Transactions Table
    const tbody = document.getElementById('rep-transactions-body');
    if (tbody) {
      if (txs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">Tidak ada transaksi pada periode ini.</td></tr>`;
      } else {
        const walletNames = {
          ops: 'Kas Operasional',
          tabungan: 'Kas Tabungan',
          infaq: 'Kas Infaq',
          bangun: 'Kas Pembangunan'
        };

        tbody.innerHTML = txs.map(t => {
          const isIncome = t.type === 'in';
          return `
            <tr>
              <td>${this.formatDateId(t.date)}</td>
              <td>
                <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">${isIncome ? 'Masuk' : 'Keluar'}</span>
              </td>
              <td>${walletNames[t.walletId] || t.walletId}</td>
              <td style="font-weight: 600;">${t.category}</td>
              <td style="font-size: 0.8rem;">${t.desc}</td>
              <td style="text-align: right; font-weight: 700; color: ${isIncome ? 'var(--primary-700)' : 'var(--danger)'};">
                ${isIncome ? '+' : '-'}${this.formatRp(t.amount)}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // Backup & Restore
  exportJsonData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.db.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_keuangan_tpa_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJsonData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.tpaInfo && parsed.wallets) {
          window.db.save(parsed);
          this.loadTPAInfoToUI();
          this.renderAll();
          alert("Data keuangan TPA berhasil dipulihkan dari file backup!");
        } else {
          alert("Format file JSON tidak sesuai.");
        }
      } catch (err) {
        alert("Gagal membaca file JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetAllData() {
    if (confirm("Apakah Anda yakin ingin mereset seluruh data aplikasi kembali ke data sampel awal? Data perubahan Anda akan ditimpa.")) {
      window.db.resetToDefault();
      this.loadTPAInfoToUI();
      this.renderAll();
      alert("Aplikasi telah direset ke data sampel bawaan.");
    }
  }

  // =========================================================================
  // 7. MASTER DATA SANTRI & PROFIL
  // =========================================================================
  renderMasterData() {
    // 1. Master Kelas RQ (Kelola & Ubah Nama Tiap Kelas)
    const classesTbody = document.getElementById('master-classes-body');
    if (classesTbody) {
      const allStudents = window.db.getStudents();
      classesTbody.innerHTML = this.rqClasses.map(c => {
        const studentCount = allStudents.filter(s => this.normalizeClassKey(s.class) === c.id).length;
        return `
          <tr>
            <td style="font-weight: 800; color: var(--primary-700);">${c.id}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">${c.icon}</span>
                <div>
                  <div style="font-weight: 800; color: var(--slate-900); font-size: 0.92rem;">${c.name}</div>
                  <div style="font-size: 0.73rem; color: var(--slate-500);">Label Tab: <strong>${c.shortName}</strong></div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--slate-800);">${c.teacher}</div>
              <div style="font-size: 0.72rem; color: var(--slate-400);">📍 ${c.room}</div>
            </td>
            <td>
              <div style="font-size: 0.8rem; color: var(--slate-600);">${c.schedule}</div>
            </td>
            <td style="text-align: center;">
              <span class="badge badge-neutral" style="font-weight: 700; font-size: 0.75rem;">👥 ${studentCount} Santri</span>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.openEditClassModal('${c.id}')" title="Ubah Nama & Rincian ${c.shortName}">
                ✏️
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    const tbody = document.getElementById('master-students-body');
    if (tbody) {
      const students = window.db.getStudents();
      tbody.innerHTML = students.map(s => `
        <tr>
          <td style="font-weight: 700; color: var(--slate-500);">${s.nis}</td>
          <td>
            <div style="font-weight: 700; color: var(--slate-900); font-size: 0.92rem;">${s.name}</div>
            ${s.nickname && s.nickname !== s.name ? `<div style="font-size: 0.72rem; color: var(--slate-500); font-weight: 600; margin-top: 2px;">(Panggilan: ${s.nickname})</div>` : ''}
            ${s.isScholarship ? '<span class="badge badge-info" style="font-size: 0.65rem;">Beasiswa Yatim</span>' : ''}
          </td>
          <td><span class="badge badge-neutral">${s.class}</span></td>
          <td>
            <div style="font-size: 0.8rem;">${s.parent}</div>
            <div style="font-size: 0.72rem; color: var(--slate-400);">${s.phone}</div>
          </td>
          <td style="font-weight: 700;">${this.formatRp(s.sppAmount)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
              <button class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Link Form Wali ${s.name}">
                🔗
              </button>
              <button class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.openStudentModal('${s.id}', true)" title="Ubah Data Santri">
                ✏️
              </button>
              <button class="btn btn-danger btn-sm btn-icon-only" onclick="app.deleteStudent('${s.id}')" title="Hapus Data Santri">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    const teachersTbody = document.getElementById('master-teachers-body');
    if (teachersTbody) {
      const teachers = window.db.getTeachers();
      teachersTbody.innerHTML = teachers.map(t => `
        <tr>
          <td style="font-weight: 700; color: var(--slate-500);">${t.id}</td>
          <td><div style="font-weight: 700; color: var(--slate-900);">${t.name}</div></td>
          <td><span class="badge badge-info">${t.role}</span></td>
          <td><div style="font-size: 0.8rem; font-family: monospace;">${t.phone}</div></td>
          <td style="text-align: center; font-weight: 600;">${t.sessions || 16} Sesi</td>
          <td style="font-weight: 700; color: var(--primary-700);">${this.formatRp(t.baseSalary)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
              <button class="btn btn-outline-primary btn-sm btn-icon-only" onclick="app.openTeacherModal('${t.id}')" title="Ubah Nama & Data Ustadz">
                ✏️
              </button>
              <button class="btn btn-danger btn-sm btn-icon-only" onclick="app.deleteTeacher('${t.id}')" title="Hapus Ustadz">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // =========================================================================
  // FITUR UBAH NAMA & RINCIAN KELAS (TIAP MASING-MASING KELAS)
  // =========================================================================
  openEditClassModal(classId) {
    const cls = window.db.getClass(classId);
    if (!cls) {
      alert('Data kelas tidak ditemukan!');
      return;
    }

    const inputId = document.getElementById('edit-class-id');
    if (inputId) inputId.value = cls.id;

    const badgeEl = document.getElementById('edit-class-badge');
    if (badgeEl) badgeEl.innerText = cls.id;

    const nameInput = document.getElementById('edit-class-name');
    if (nameInput) nameInput.value = cls.name;

    const shortInput = document.getElementById('edit-class-short');
    if (shortInput) shortInput.value = cls.shortName || '';

    const iconInput = document.getElementById('edit-class-icon');
    if (iconInput) iconInput.value = cls.icon || '📖';

    const roomInput = document.getElementById('edit-class-room');
    if (roomInput) roomInput.value = cls.room || '';

    const schedInput = document.getElementById('edit-class-schedule');
    if (schedInput) schedInput.value = cls.schedule || '';

    // Isi dropdown rekomendasi ustadz / ustadzah
    const teacherSelect = document.getElementById('edit-class-teacher-select');
    if (teacherSelect) {
      const teachers = window.db.getTeachers();
      let optHtml = `<option value="">-- Rekomendasi Guru (Klik untuk Memilih) --</option>`;
      teachers.forEach(t => {
        const isSel = (cls.teacher && cls.teacher.includes(t.name)) ? 'selected' : '';
        optHtml += `<option value="${t.name}" ${isSel}>${t.name} (${t.role})</option>`;
      });
      teacherSelect.innerHTML = optHtml;
    }

    const teacherInput = document.getElementById('edit-class-teacher');
    if (teacherInput) teacherInput.value = cls.teacher || '';

    this.openModal('modal-edit-class');
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 150);
  }

  onEditClassTeacherSelectChange() {
    const sel = document.getElementById('edit-class-teacher-select');
    const input = document.getElementById('edit-class-teacher');
    if (sel && input && sel.value) {
      input.value = sel.value;
    }
  }

  setEditClassIcon(emoji) {
    const input = document.getElementById('edit-class-icon');
    if (input) input.value = emoji;
  }

  submitEditClass(e) {
    if (e && e.preventDefault) e.preventDefault();
    const classId = document.getElementById('edit-class-id')?.value;
    const name = document.getElementById('edit-class-name')?.value.trim();
    let shortName = document.getElementById('edit-class-short')?.value.trim();
    const icon = document.getElementById('edit-class-icon')?.value.trim() || '📖';
    const teacher = document.getElementById('edit-class-teacher')?.value.trim() || '';
    const room = document.getElementById('edit-class-room')?.value.trim() || '';
    const schedule = document.getElementById('edit-class-schedule')?.value.trim() || '';

    if (!name) {
      alert('Silakan masukkan nama lengkap kelas!');
      const nameInput = document.getElementById('edit-class-name');
      if (nameInput) nameInput.focus();
      return;
    }

    if (!shortName) {
      shortName = name.length > 20 ? name.slice(0, 20) + '...' : name;
    }

    try {
      const updated = window.db.updateClass(classId, {
        name,
        shortName,
        icon,
        teacher,
        room,
        schedule
      });

      this.closeModal('modal-edit-class');
      this.populateStudentClassOptions();
      this.renderAll();
      this.showToast(`Alhamdulillah! Nama kelas "${name}" berhasil diperbarui.`);
    } catch (err) {
      console.error('Gagal memperbarui kelas:', err);
      alert('Terjadi kendala saat menyimpan nama kelas: ' + err.message);
    }
  }

  populateStudentClassOptions(selectedValue = null) {
    const classSelect = document.getElementById('std-class');
    if (!classSelect) return;
    classSelect.innerHTML = this.rqClasses.map(c => {
      const isSel = (selectedValue && (selectedValue === c.name || selectedValue === c.id || selectedValue === c.shortName)) ? 'selected' : '';
      return `<option value="${c.name}" ${isSel}>${c.icon} ${c.name}</option>`;
    }).join('');
  }

  openStudentModal(studentIdOrClass = null, isEdit = false) {
    const idInput = document.getElementById('std-id');
    const titleEl = document.getElementById('modal-student-title');
    const saveBtn = document.getElementById('btn-save-student');
    const nisInput = document.getElementById('std-nis');
    const nameInput = document.getElementById('std-name');
    const fullNameInput = document.getElementById('std-fullname');
    const classSelect = document.getElementById('std-class');
    const parentInput = document.getElementById('std-parent');
    const phoneInput = document.getElementById('std-phone');
    const sppInput = document.getElementById('std-spp');
    const schCheck = document.getElementById('std-scholarship');

    // Cek apakah mode edit santri
    const studentToEdit = isEdit ? window.db.getStudents().find(s => s.id === studentIdOrClass) : null;

    if (studentToEdit) {
      if (idInput) idInput.value = studentToEdit.id;
      if (titleEl) titleEl.innerText = `✏️ Ubah Data Santri (${studentToEdit.name})`;
      if (saveBtn) saveBtn.innerText = '💾 Simpan Perubahan Santri';
      if (nisInput) nisInput.value = studentToEdit.nis || '';
      if (nameInput) nameInput.value = studentToEdit.name || '';
      if (fullNameInput) fullNameInput.value = studentToEdit.fullName || '';
      if (parentInput) parentInput.value = studentToEdit.parent || '';
      if (phoneInput) phoneInput.value = studentToEdit.phone || '';
      if (sppInput) sppInput.value = studentToEdit.sppAmount !== undefined ? studentToEdit.sppAmount : 50000;
      if (schCheck) schCheck.checked = Boolean(studentToEdit.isScholarship);

      this.populateStudentClassOptions(studentToEdit.class);
    } else {
      if (idInput) idInput.value = '';
      if (titleEl) titleEl.innerText = '➕ Tambah Data Santri Baru';
      if (saveBtn) saveBtn.innerText = 'Simpan Data Santri';

      const students = window.db.getStudents();
      const curYear = new Date().getFullYear();
      let maxNisNum = 0;
      students.forEach(s => {
        const nStr = String(s.nis || '');
        if (nStr.startsWith(String(curYear))) {
          const val = parseInt(nStr.slice(4), 10);
          if (!isNaN(val) && val > maxNisNum) maxNisNum = val;
        }
      });

      if (nisInput) nisInput.value = `${curYear}${String(maxNisNum + 1).padStart(2, '0')}`;
      if (nameInput) nameInput.value = '';
      if (fullNameInput) fullNameInput.value = '';
      if (parentInput) parentInput.value = '';
      if (phoneInput) phoneInput.value = '628';
      if (sppInput) sppInput.value = '50000';
      if (schCheck) schCheck.checked = false;

      // Populasi opsi kelas secara dinamis
      this.populateStudentClassOptions();

      if (classSelect) {
        if (studentIdOrClass) {
          const normKey = this.normalizeClassKey(studentIdOrClass);
          const targetCls = this.rqClasses.find(c => c.id === normKey);
          if (targetCls) {
            classSelect.value = targetCls.name;
          } else {
            classSelect.selectedIndex = 0;
          }
        } else {
          classSelect.selectedIndex = 0;
        }
      }
    }

    this.openModal('modal-student');
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 150);
  }

  submitStudent(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('std-id')?.value.trim();
    const nis = document.getElementById('std-nis')?.value.trim();
    const name = document.getElementById('std-name')?.value.trim();
    const fullName = document.getElementById('std-fullname')?.value.trim() || '';
    const stdClass = document.getElementById('std-class')?.value;
    const parent = document.getElementById('std-parent')?.value.trim();
    let phone = document.getElementById('std-phone')?.value.trim() || '';
    const sppAmount = Number(document.getElementById('std-spp')?.value || 50000);
    const isScholarship = Boolean(document.getElementById('std-scholarship')?.checked);

    if (!name) {
      alert('Silakan masukkan nama lengkap santri!');
      const nameInput = document.getElementById('std-name');
      if (nameInput) nameInput.focus();
      return;
    }

    // Normalisasi nomor telepon WhatsApp (awalan 62)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone && !cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }
    if (!cleanPhone) cleanPhone = '6281234567890';

    try {
      const clsKey = this.normalizeClassKey(stdClass);
      if (id) {
        // UPDATE MODE
        window.db.updateStudent(id, {
          nis: nis || undefined,
          name: name,
          fullName: fullName || undefined,
          classId: clsKey,
          class: stdClass || (this.rqClasses[0] ? this.rqClasses[0].name : 'Kelas 1'),
          parent: parent || ('Wali ' + name),
          phone: cleanPhone,
          sppAmount: isScholarship ? 0 : sppAmount,
          isScholarship: isScholarship
        });

        this.closeModal('modal-student');
        this.renderAll();
        this.showToast(`Alhamdulillah! Data santri ${name} berhasil diperbarui.`);
      } else {
        // ADD MODE
        const added = window.db.addStudent({
          nis: nis || undefined,
          name: name,
          fullName: fullName || undefined,
          classId: clsKey,
          class: stdClass || (this.rqClasses[0] ? this.rqClasses[0].name : 'Kelas 1'),
          parent: parent || ('Wali ' + name),
          phone: cleanPhone,
          sppAmount: isScholarship ? 0 : sppAmount,
          isScholarship: isScholarship
        });

        this.closeModal('modal-student');
        this.renderAll();
        this.showToast(`Alhamdulillah! Santri ${name} berhasil didaftarkan ke ${added.class}.`);
      }
    } catch (err) {
      console.error('Gagal menyimpan santri:', err);
      alert('Terjadi kendala saat menyimpan data santri: ' + err.message);
    }
  }

  deleteStudent(id) {
    const student = window.db.getStudent(id);
    if (!student) return;
    if (confirm(`Yakin ingin menghapus santri ${student.name}?`)) {
      window.db.deleteStudent(id);
      this.renderAll();
      this.showToast(`Data santri ${student.name} berhasil dihapus.`);
    }
  }

  saveTpaInfo(e) {
    e.preventDefault();
    const pinVal = document.getElementById('info-tpa-pin')?.value || '060708';
    const oldInfo = window.db.getTPAInfo() || {};

    let finalAppLogo = oldInfo.appLogo || "";
    if (this.uploadedAppLogo !== null) {
      finalAppLogo = this.uploadedAppLogo;
    }

    let finalQrisUrl = oldInfo.qrisUrl || "";
    if (this.uploadedQrisImage !== null) {
      finalQrisUrl = this.uploadedQrisImage;
    }

    const newInfo = {
      appName: document.getElementById('info-app-name')?.value || 'SikadTPA Keuangan',
      appLogo: finalAppLogo,
      nama: document.getElementById('info-tpa-name').value,
      masjid: document.getElementById('info-tpa-masjid').value,
      alamat: document.getElementById('info-tpa-alamat').value,
      kontak: document.getElementById('info-tpa-kontak')?.value || '',
      rekening: document.getElementById('info-tpa-rekening').value,
      ketua: document.getElementById('info-tpa-ketua').value,
      bendahara: document.getElementById('info-tpa-bendahara').value,
      securityPin: pinVal,
      qrisUrl: finalQrisUrl,
      qrisNmid: document.getElementById('info-qris-nmid')?.value || 'ID1026091234567 • A01',
      qrisMerchant: document.getElementById('info-qris-merchant')?.value || document.getElementById('info-tpa-name').value
    };

    window.db.updateTPAInfo(newInfo);
    window.db.updateSecurityPin(pinVal);
    this.uploadedAppLogo = null;
    this.uploadedQrisImage = null;
    this.loadTPAInfoToUI();
    this.generateReport();
    this.showToast("Alhamdulillah! Pengaturan lembaga, nama sistem, logo & QRIS berhasil disimpan!");
  }

  // =========================================================================
  // GENERIC MODAL CONTROLLER & TX HANDLER
  // =========================================================================
  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  openTxModal(type = 'in', defaultWallet = 'ops') {
    const typeSelect = document.getElementById('tx-type');
    if (typeSelect) typeSelect.value = type;
    const walletSelect = document.getElementById('tx-wallet');
    if (walletSelect) walletSelect.value = defaultWallet;
    const amountInput = document.getElementById('tx-amount');
    if (amountInput) amountInput.value = '';
    const catInput = document.getElementById('tx-category');
    if (catInput) catInput.value = '';
    const descInput = document.getElementById('tx-desc');
    if (descInput) descInput.value = '';
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const titleEl = document.getElementById('modal-tx-title');
    if (titleEl) {
      titleEl.innerText = type === 'in' ? 'Catat Kas Masuk (Penerimaan / Infaq)' : 'Catat Kas Keluar (Pengeluaran Operasional)';
    }

    this.openModal('modal-tx');
    setTimeout(() => {
      if (amountInput) amountInput.focus();
    }, 150);
  }

  onTxTypeChange() {
    const type = document.getElementById('tx-type').value;
    const titleEl = document.getElementById('modal-tx-title');
    if (titleEl) {
      titleEl.innerText = type === 'in' ? 'Catat Kas Masuk (Penerimaan / Infaq)' : 'Catat Kas Keluar (Pengeluaran Operasional)';
    }
  }

  submitTx(e) {
    if (e && e.preventDefault) e.preventDefault();
    const type = document.getElementById('tx-type')?.value || 'in';
    const walletId = document.getElementById('tx-wallet')?.value || 'ops';
    let category = document.getElementById('tx-category')?.value.trim();
    let amount = Number(document.getElementById('tx-amount')?.value || 0);
    let date = document.getElementById('tx-date')?.value;
    if (!date) date = new Date().toISOString().split('T')[0];
    const desc = document.getElementById('tx-desc')?.value.trim() || '';

    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Silakan masukkan nominal transaksi yang valid (lebih dari Rp 0)!');
      document.getElementById('tx-amount')?.focus();
      return;
    }

    if (!category) {
      category = type === 'in' ? 'Pemasukan Kas' : 'Pengeluaran Kas';
    }

    try {
      window.db.addTransaction({
        date,
        type,
        walletId,
        category,
        amount,
        desc,
        ref: 'TX-' + Date.now().toString().slice(-4)
      });

      this.closeModal('modal-tx');
      this.renderAll();
      this.showToast(`Alhamdulillah! Transaksi ${category} sebesar ${this.formatRp(amount)} berhasil disimpan.`);
    } catch (err) {
      console.error('Gagal mencatat transaksi:', err);
      alert('Terjadi kendala saat menyimpan transaksi: ' + err.message);
    }
  }

  // =========================================================================
  // MODUL PENGELOLAAN GURU & USTADZ
  // =========================================================================
  openTeacherModal(teacherId = null) {
    const idInput = document.getElementById('teacher-id');
    const titleEl = document.getElementById('modal-teacher-title');
    const saveBtn = document.getElementById('btn-save-teacher');
    const nameInput = document.getElementById('teacher-name');
    const roleSelect = document.getElementById('teacher-role');
    const phoneInput = document.getElementById('teacher-phone');
    const sessionsInput = document.getElementById('teacher-sessions');
    const salaryInput = document.getElementById('teacher-salary');

    // Populasi opsi tugas / peran guru dinamis
    if (roleSelect) {
      const standardRoles = [
        "Pengajar Tahsin & Al-Qur'an",
        "Pengajar Jilid 1 - 2",
        "Pengajar Jilid 3 - 4",
        "Pengajar Tahfidz & Doa Harian",
        "Pengajar Fiqih & Akhlak",
        "Koordinator Kurikulum & Pengajar",
        "Pengajar Iqro Dasar",
        "Pengajar Al-Qur'an (Umum)"
      ];
      const classRoles = (this.rqClasses || []).map(c => `Pengajar ${c.name}`);
      const allRoles = Array.from(new Set([...standardRoles, ...classRoles]));
      roleSelect.innerHTML = allRoles.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    if (teacherId) {
      // EDIT MODE
      const teacher = window.db.getTeachers().find(t => t.id === teacherId);
      if (!teacher) {
        alert('Data pengajar tidak ditemukan!');
        return;
      }
      if (idInput) idInput.value = teacher.id;
      if (titleEl) titleEl.innerText = `✏️ Ubah Data Pengajar (${teacher.name})`;
      if (saveBtn) saveBtn.innerText = '💾 Simpan Perubahan Pengajar';
      if (nameInput) nameInput.value = teacher.name || '';
      if (phoneInput) phoneInput.value = teacher.phone || '';
      if (sessionsInput) sessionsInput.value = teacher.sessions || 16;
      if (salaryInput) salaryInput.value = teacher.baseSalary || 700000;
      if (roleSelect && teacher.role) {
        if (!Array.from(roleSelect.options).some(o => o.value === teacher.role)) {
          roleSelect.add(new Option(teacher.role, teacher.role));
        }
        roleSelect.value = teacher.role;
      }
    } else {
      // ADD MODE
      if (idInput) idInput.value = '';
      if (titleEl) titleEl.innerText = '➕ Tambah Pengajar / Ustadz Baru';
      if (saveBtn) saveBtn.innerText = 'Simpan Data Pengajar';
      if (nameInput) nameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (sessionsInput) sessionsInput.value = '16';
      if (salaryInput) salaryInput.value = '700000';
      if (roleSelect) roleSelect.selectedIndex = 0;
    }

    this.openModal('modal-teacher');
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 150);
  }

  submitTeacher(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('teacher-id')?.value.trim();
    const name = document.getElementById('teacher-name')?.value.trim();
    const role = document.getElementById('teacher-role')?.value || "Pengajar Al-Qur'an";
    let phone = document.getElementById('teacher-phone')?.value.trim() || '';
    const sessions = Number(document.getElementById('teacher-sessions')?.value || 16);
    const salary = Number(document.getElementById('teacher-salary')?.value || 700000);

    if (!name) {
      alert('Silakan masukkan nama lengkap pengajar / ustadz!');
      document.getElementById('teacher-name')?.focus();
      return;
    }

    let cleanPhone = phone.replace(/[^\d+ -]/g, '').trim();
    if (!cleanPhone) cleanPhone = '081234567890';

    try {
      if (id) {
        // UPDATE MODE
        const updated = window.db.updateTeacher(id, {
          name,
          role,
          phone: cleanPhone,
          sessions,
          baseSalary: salary
        });

        this.closeModal('modal-teacher');
        this.renderAll();
        this.showToast(`Alhamdulillah! Data ustadz/ustadzah ${name} berhasil diperbarui.`);
      } else {
        // ADD MODE
        const added = window.db.addTeacher({
          name,
          role,
          phone: cleanPhone,
          sessions,
          baseSalary: salary
        });

        this.closeModal('modal-teacher');
        this.renderAll();
        this.showToast(`Alhamdulillah! Ustadz/Ustadzah ${name} berhasil didaftarkan sebagai pengajar.`);
      }
    } catch (err) {
      console.error('Gagal menyimpan pengajar:', err);
      alert('Kendala menyimpan data ustadz: ' + err.message);
    }
  }

  deleteTeacher(id) {
    const teacher = window.db.getTeachers().find(t => t.id === id);
    if (!teacher) return;
    if (confirm(`Yakin ingin menghapus data ustadz/ustadzah ${teacher.name}?`)) {
      window.db.deleteTeacher(id);
      this.renderAll();
      this.showToast(`Data pengajar ${teacher.name} berhasil dihapus.`);
    }
  }

  // =========================================================================
  // Multi-Theme Engine & Guide Helpers
  // =========================================================================
  initTheme() {
    const savedTheme = localStorage.getItem('SIKAD_THEME_KEY') || 'royal';
    this.applyTheme(savedTheme, false);
    this.bindThemeEvents();
  }

  applyTheme(themeKey, showToastNotification = true) {
    const themeNames = {
      'royal': 'Royal Sapphire',
      'persian': 'Persian Turquoise',
      'terracotta': 'Moroccan Terracotta',
      'midnight': 'Obsidian Midnight',
      'emerald': 'Classic Emerald'
    };

    const targetTheme = themeNames[themeKey] ? themeKey : 'royal';
    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('SIKAD_THEME_KEY', targetTheme);

    // Update Label di UI
    const labelEl = document.getElementById('current-theme-label');
    if (labelEl) {
      labelEl.innerText = themeNames[targetTheme];
    }

    // Update status active pada opsi menu tema
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-theme-val') === targetTheme);
    });

    if (showToastNotification) {
      this.showToast(`Tema aktif: ${themeNames[targetTheme]}`);
    }
  }

  bindThemeEvents() {
    const toggleBtn = document.getElementById('btn-theme-dropdown');
    const menuEl = document.getElementById('theme-dropdown-menu');

    if (toggleBtn && menuEl) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEl.classList.toggle('show');
      });

      // Tutup dropdown saat klik di luar
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#theme-dropdown-container')) {
          menuEl.classList.remove('show');
        }
      });
    }

    // Klik opsi pilihan tema
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const themeVal = opt.getAttribute('data-theme-val');
        if (themeVal) {
          this.applyTheme(themeVal, true);
          if (menuEl) menuEl.classList.remove('show');
        }
      });
    });

    // Tombol panduan cepat di header
    const btnGuide = document.getElementById('btn-open-guide-modal');
    if (btnGuide) {
      btnGuide.addEventListener('click', () => {
        this.openModal('modal-guide');
      });
    }
  }

  // =========================================================================
  // SPOTLIGHT COMMAND PALETTE CONTROLLER (Ctrl+K)
  // =========================================================================
  initCommandPalette() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeCommandPalette();
      }
    });

    const searchInput = document.getElementById('command-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterCommandPalette());
    }
  }

  openCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-search-input');
    if (!modal) return;
    modal.classList.add('active');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 60);
    }
    this.renderCommandResults('');
  }

  closeCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    if (modal) modal.classList.remove('active');
  }

  handleCmdBackdropClick(e) {
    if (e.target.id === 'command-palette-modal') {
      this.closeCommandPalette();
    }
  }

  filterCommandPalette() {
    const query = (document.getElementById('command-search-input')?.value || '').toLowerCase().trim();
    this.renderCommandResults(query);
  }

  renderCommandResults(query) {
    const list = document.getElementById('command-results-list');
    if (!list) return;

    const students = window.db.getStudents();
    const teachers = window.db.getTeachers();

    const navItems = [
      { id: 'tab-dashboard', title: 'Dashboard Kas & Likuiditas', tag: 'Navigasi', icon: '📊' },
      { id: 'tab-spp', title: 'SPP & Syahriah Santri (Dual View)', tag: 'Navigasi', icon: '📖' },
      { id: 'tab-tabungan', title: 'Buku Tabungan Santri', tag: 'Navigasi', icon: '💰' },
      { id: 'tab-infaq', title: 'Infaq, Sedekah & QRIS', tag: 'Navigasi', icon: '🤲' },
      { id: 'tab-pengeluaran', title: 'Bisyarah Guru & Belanja Operasional', tag: 'Navigasi', icon: '💼' },
      { id: 'tab-laporan', title: 'Laporan Keuangan Resmi & Rekap Cetak', tag: 'Navigasi', icon: '🖨️' },
      { id: 'tab-master', title: 'Master Santri, Ustadz & Profil Lembaga', tag: 'Navigasi', icon: '🏢' },
      { id: 'tab-panduan', title: 'Panduan Ubah Isi & Desain', tag: 'Bantuan', icon: '🧭' }
    ];

    const actions = [
      { action: () => { this.closeCommandPalette(); this.openTxModal('in', 'ops'); }, title: 'Catat Pemasukan Kas Baru', tag: 'Aksi Cepat', icon: '➕' },
      { action: () => { this.closeCommandPalette(); this.openTxModal('out', 'ops'); }, title: 'Catat Pengeluaran Kas Baru', tag: 'Aksi Cepat', icon: '➖' },
      { action: () => { this.closeCommandPalette(); this.openSavingsModal('Setor'); }, title: 'Catat Setoran Tabungan Santri', tag: 'Aksi Cepat', icon: '💵' },
      { action: () => { this.closeCommandPalette(); this.openSavingsModal('Tarik'); }, title: 'Catat Penarikan Tabungan Santri', tag: 'Aksi Cepat', icon: '💸' },
      { action: () => { this.closeCommandPalette(); this.openQRISModal(); }, title: 'Tampilkan Barcode QRIS Infaq', tag: 'Aksi Cepat', icon: '📱' },
      { action: () => { this.closeCommandPalette(); this.openStudentModal(); }, title: 'Tambah Santri Baru', tag: 'Aksi Cepat', icon: '👤' }
    ];

    let html = '';

    // Quick Actions
    const matchingActions = actions.filter(a => !query || a.title.toLowerCase().includes(query));
    if (matchingActions.length > 0) {
      html += `<div class="command-group-heading">Aksi Cepat Keuangan</div>`;
      html += matchingActions.map((a, idx) => `
        <div class="command-result-item" onclick="app.executeCmdAction(${idx})">
          <div class="command-item-icon">${a.icon}</div>
          <div class="command-item-info">
            <div class="command-item-title">${a.title}</div>
          </div>
          <span class="command-item-tag">${a.tag}</span>
        </div>
      `).join('');
      this._tempCmdActions = matchingActions;
    }

    // Navigation Menu
    const matchingNav = navItems.filter(n => !query || n.title.toLowerCase().includes(query));
    if (matchingNav.length > 0) {
      html += `<div class="command-group-heading">Pintas Menu</div>`;
      html += matchingNav.map(n => `
        <div class="command-result-item" onclick="app.closeCommandPalette(); app.switchTab('${n.id}')">
          <div class="command-item-icon">${n.icon}</div>
          <div class="command-item-info">
            <div class="command-item-title">${n.title}</div>
          </div>
          <span class="command-item-tag">${n.tag}</span>
        </div>
      `).join('');
    }

    // Santri Results
    const matchingStudents = students.filter(s => !query || s.name.toLowerCase().includes(query) || s.nis.includes(query) || s.parent.toLowerCase().includes(query)).slice(0, 5);
    if (matchingStudents.length > 0) {
      html += `<div class="command-group-heading">Data Santri & SPP</div>`;
      html += matchingStudents.map(s => `
        <div class="command-result-item" onclick="app.closeCommandPalette(); app.switchTab('tab-spp');">
          <div class="command-item-icon">👦</div>
          <div class="command-item-info">
            <div class="command-item-title">${s.name} (${s.class})</div>
            <div class="command-item-sub">Wali: ${s.parent} • NIS: ${s.nis}</div>
          </div>
          <span class="command-item-tag">Santri</span>
        </div>
      `).join('');
    }

    // Teachers Results
    const matchingTeachers = teachers.filter(t => !query || t.name.toLowerCase().includes(query) || t.role.toLowerCase().includes(query)).slice(0, 3);
    if (matchingTeachers.length > 0) {
      html += `<div class="command-group-heading">Ustadz & Guru</div>`;
      html += matchingTeachers.map(t => `
        <div class="command-result-item" onclick="app.closeCommandPalette(); app.switchTab('tab-pengeluaran');">
          <div class="command-item-icon">👳</div>
          <div class="command-item-info">
            <div class="command-item-title">${t.name}</div>
            <div class="command-item-sub">${t.role} • Bisyarah: ${this.formatRp(t.monthlyHonor)}</div>
          </div>
          <span class="command-item-tag">Guru</span>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div style="text-align: center; color: var(--slate-400); padding: 30px; font-size: 0.85rem;">Tidak ditemukan hasil untuk "${query}"</div>`;
    }

    list.innerHTML = html;
  }

  executeCmdAction(idx) {
    if (this._tempCmdActions && this._tempCmdActions[idx]) {
      this._tempCmdActions[idx].action();
    }
  }

  // =========================================================================
  // SECURITY PIN LOCK GATE CONTROLLER (PIN: 060708)
  // =========================================================================
  initSecurityPinGate() {
    const isUnlocked = sessionStorage.getItem('sikadtpa_unlocked') === 'true';
    const screen = document.getElementById('security-pin-screen');
    if (isUnlocked) {
      if (screen) {
        screen.classList.add('unlocked');
        screen.style.display = 'none';
        screen.style.pointerEvents = 'none';
      }
    } else {
      if (screen) {
        screen.classList.remove('unlocked');
        screen.style.display = 'flex';
        screen.style.pointerEvents = 'auto';
        this.clearPin();
        this.resetPinStatus();
      }
    }

    // Keypad numbers
    document.querySelectorAll('.pin-key-btn[data-key]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.getAttribute('data-key');
        if (key !== null) this.inputPinDigit(key);
      });
    });

    // Clear and Backspace buttons
    const btnClear = document.getElementById('btn-pin-clear');
    if (btnClear) {
      btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearPin();
      });
    }

    const btnBack = document.getElementById('btn-pin-backspace');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        this.backspacePin();
      });
    }

    // Physical Keyboard support
    window.addEventListener('keydown', (e) => {
      const screenEl = document.getElementById('security-pin-screen');
      if (!screenEl || screenEl.classList.contains('unlocked')) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.inputPinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.backspacePin();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.clearPin();
      }
    });
  }

  inputPinDigit(digit) {
    if (this.enteredPin.length < 6) {
      this.enteredPin += digit;
      this.updatePinDots();

      if (this.enteredPin.length === 6) {
        setTimeout(() => this.verifyPin(), 60);
      }
    }
  }

  backspacePin() {
    if (this.enteredPin.length > 0) {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.updatePinDots();
      this.resetPinStatus();
    }
  }

  clearPin() {
    this.enteredPin = '';
    this.updatePinDots();
    this.resetPinStatus();
  }

  updatePinDots() {
    const dots = document.querySelectorAll('#pin-dots-container .pin-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < this.enteredPin.length);
    });
  }

  resetPinStatus() {
    const msg = document.getElementById('pin-status-message');
    if (msg) {
      msg.innerText = 'Masukkan 6 Digit PIN Keamanan';
      msg.classList.remove('error');
    }
  }

  verifyPin() {
    const correctPin = window.db.getSecurityPin() || '060708';
    const msg = document.getElementById('pin-status-message');
    const screen = document.getElementById('security-pin-screen');
    const box = document.querySelector('.pin-gate-box');

    if (this.enteredPin === correctPin) {
      if (msg) {
        msg.innerText = '✓ PIN Benar! Membuka akses...';
        msg.classList.remove('error');
      }
      sessionStorage.setItem('sikadtpa_unlocked', 'true');

      setTimeout(() => {
        if (screen) {
          screen.classList.add('unlocked');
          screen.style.display = 'none';
          screen.style.pointerEvents = 'none';
        }
        this.enteredPin = '';
        this.updatePinDots();
        this.resetPinStatus();
        this.showToast('Selamat datang! Akses keuangan terbuka.');

        // Jalankan sinkronisasi data santri jika ada link dari WA yang baru diklik
        this.checkUrlAutoUpdate();
      }, 250);
    } else {
      if (msg) {
        msg.innerText = '✕ PIN salah! Silakan coba lagi.';
        msg.classList.add('error');
      }
      if (box) {
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
      }

      setTimeout(() => {
        this.enteredPin = '';
        this.updatePinDots();
      }, 500);
    }
  }

  lockSession() {
    sessionStorage.removeItem('sikadtpa_unlocked');
    const screen = document.getElementById('security-pin-screen');
    if (screen) {
      screen.classList.remove('unlocked');
      screen.style.display = 'flex';
      screen.style.pointerEvents = 'auto';
      this.clearPin();
      this.resetPinStatus();
    }
    this.showToast('🔒 Aplikasi telah dikunci. Masukkan PIN untuk membuka.');
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    const toastText = document.getElementById('app-toast-text');
    if (toast && toastText) {
      toastText.innerText = message;
      toast.classList.add('show');
      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2800);
    }
  }

  // =========================================================================
  // 8. DATABASE SPREADSHEET (EXCEL & GOOGLE SHEETS INTEGRATION)
  // =========================================================================
  openSpreadsheetModal() {
    this.switchSpreadsheetTab('export');
    this.openModal('modal-spreadsheet');
  }

  switchSpreadsheetTab(tabName) {
    const tabs = ['export', 'sync', 'import'];
    tabs.forEach(t => {
      const btn = document.getElementById(`btn-sheet-tab-${t}`);
      const sec = document.getElementById(`sheet-section-${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (sec) sec.style.display = (t === tabName) ? 'block' : 'none';
    });

    if (tabName === 'sync') {
      const savedUrl = localStorage.getItem('SIKAD_SHEET_URL') || '';
      const input = document.getElementById('sheet-sync-url');
      const statusEl = document.getElementById('sheet-sync-status');
      if (input) input.value = savedUrl;
      if (statusEl) {
        if (savedUrl) {
          statusEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;">✓ URL Tersimpan:</span> ${savedUrl.slice(0, 50)}...`;
        } else {
          statusEl.innerText = 'Status: Belum ada URL sinkronisasi tersimpan.';
        }
      }
    }
  }

  escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  downloadCsv(filename, csvContent) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportStudentsCsv() {
    const students = window.db.getStudents();
    const headers = ['ID Santri', 'NIS', 'Nama Lengkap Santri', 'Kelas / Jilid RQ', 'Nama Orang Tua / Wali', 'No WhatsApp Wali', 'Tarif SPP Bulanan (Rp)', 'Status Beasiswa / Yatim', 'Saldo Tabungan (Rp)'];
    
    let csv = headers.map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    students.forEach(s => {
      const row = [
        s.id,
        s.nis || '-',
        s.name,
        s.class,
        s.parent || '-',
        s.phone || '-',
        s.sppAmount || 0,
        s.isScholarship ? 'Ya (Beasiswa)' : 'Tidak',
        s.savingsBalance || 0
      ];
      csv += row.map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`Data_Santri_RQ_Ummul_Qosim_${dateStr}.csv`, csv);
    this.showToast('📥 Spreadsheet Data Santri berhasil diunduh!');
  }

  exportSppRecordsCsv() {
    const records = window.db.data.sppRecords || [];
    const headers = ['ID Record', 'NIS Santri', 'Nama Santri', 'Kelas', 'Bulan Tagihan', 'Nominal SPP (Rp)', 'Status Pembayaran', 'Tanggal Pelunasan', 'Metode Bayar', 'Nomor Kwitansi'];
    
    let csv = headers.map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    records.forEach(r => {
      const student = window.db.getStudent(r.studentId);
      const row = [
        r.id,
        student ? student.nis : '-',
        student ? student.name : '-',
        student ? student.class : '-',
        r.month,
        r.amount,
        r.status === 'paid' ? 'Lunas' : 'Belum Lunas',
        r.paidDate || '-',
        r.method || 'Tunai',
        r.receiptNo || '-'
      ];
      csv += row.map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`Rekap_SPP_RQ_Ummul_Qosim_${dateStr}.csv`, csv);
    this.showToast('📥 Spreadsheet Rekap SPP berhasil diunduh!');
  }

  exportCashflowCsv() {
    const txs = window.db.getTransactions();
    const headers = ['ID Transaksi', 'Tanggal', 'Jenis Kas', 'Pos Rekening / Kantong', 'Kategori', 'Nominal (Rp)', 'Keterangan'];
    const walletMap = {
      'ops': 'Kas Operasional',
      'tabungan': 'Kas Tabungan Santri',
      'infaq': 'Kas Infaq & Sedekah',
      'bangun': 'Kas Pembangunan Masjid'
    };

    let csv = headers.map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    txs.forEach(t => {
      const row = [
        t.id,
        t.date,
        t.type === 'in' ? 'Pemasukan (Masuk)' : 'Pengeluaran (Keluar)',
        walletMap[t.walletId] || t.walletId,
        t.category,
        t.amount,
        t.desc || '-'
      ];
      csv += row.map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`Buku_Kas_RQ_Ummul_Qosim_${dateStr}.csv`, csv);
    this.showToast('📥 Spreadsheet Buku Kas berhasil diunduh!');
  }

  exportSavingsCsv() {
    const savingsList = window.db.data.savingsTransactions || [];
    const headers = ['ID Mutasi', 'Tanggal', 'NIS Santri', 'Nama Santri', 'Kelas', 'Jenis Mutasi', 'Nominal (Rp)', 'Keterangan'];

    let csv = headers.map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    savingsList.forEach(item => {
      const student = window.db.getStudent(item.studentId);
      const row = [
        item.id,
        item.date,
        student ? student.nis : '-',
        student ? student.name : '-',
        student ? student.class : '-',
        item.type === 'Setor' ? 'Setoran Masuk' : 'Penarikan Keluar',
        item.amount,
        item.note || '-'
      ];
      csv += row.map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`Tabungan_Santri_RQ_Ummul_Qosim_${dateStr}.csv`, csv);
    this.showToast('📥 Spreadsheet Tabungan Santri berhasil diunduh!');
  }

  exportAllDatabaseJsonCsv() {
    const students = window.db.getStudents();
    const records = window.db.data.sppRecords || [];
    const txs = window.db.getTransactions();

    let fullCsv = '### MASTER DATABASE SIKAD TPA RQ UMMUL QOSIM ###\r\n\r\n';

    // Section 1: Santri
    fullCsv += '[1. DATA SANTRI 4 KELAS]\r\n';
    fullCsv += ['ID', 'NIS', 'Nama Santri', 'Kelas', 'Wali', 'WhatsApp', 'Tarif SPP', 'Beasiswa', 'Saldo Tabungan'].map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    students.forEach(s => {
      fullCsv += [s.id, s.nis || '-', s.name, s.class, s.parent || '-', s.phone || '-', s.sppAmount || 0, s.isScholarship ? 'Ya' : 'Tidak', s.savingsBalance || 0].map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    // Section 2: SPP
    fullCsv += '\r\n[2. REKAP PEMBAYARAN SPP]\r\n';
    fullCsv += ['ID Record', 'NIS', 'Nama Santri', 'Bulan Tagihan', 'Nominal', 'Status', 'Tgl Bayar', 'Metode', 'No Kwitansi'].map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    records.forEach(r => {
      const st = window.db.getStudent(r.studentId);
      fullCsv += [r.id, st ? st.nis : '-', st ? st.name : '-', r.month, r.amount, r.status, r.paidDate || '-', r.method || '-', r.receiptNo || '-'].map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    // Section 3: Kas
    fullCsv += '\r\n[3. BUKU ARUS KAS]\r\n';
    fullCsv += ['ID Kas', 'Tanggal', 'Jenis', 'Pos Kas', 'Kategori', 'Nominal', 'Keterangan'].map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    txs.forEach(t => {
      fullCsv += [t.id, t.date, t.type === 'in' ? 'Masuk' : 'Keluar', t.walletId, t.category, t.amount, t.desc || '-'].map(v => this.escapeCsvCell(v)).join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`Master_Database_Lengkap_RQ_Ummul_Qosim_${dateStr}.csv`, fullCsv);
    this.showToast('📥 Seluruh Master Database Spreadsheet berhasil diunduh!');
  }

  saveGoogleSheetsUrl() {
    const input = document.getElementById('sheet-sync-url');
    const url = input ? input.value.trim() : '';
    if (!url) {
      alert('Silakan masukkan URL Web App Google Apps Script Anda!');
      return;
    }
    localStorage.setItem('SIKAD_SHEET_URL', url);
    const statusEl = document.getElementById('sheet-sync-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;">✓ URL Tersimpan:</span> ${url.slice(0, 50)}...`;
    }
    this.showToast('URL Google Sheets berhasil disimpan!');
  }

  async syncToGoogleSheets() {
    const input = document.getElementById('sheet-sync-url');
    let url = input ? input.value.trim() : '';
    if (!url) {
      url = localStorage.getItem('SIKAD_SHEET_URL') || '';
    }
    if (!url) {
      alert('Silakan masukkan dan simpan URL Web App Google Apps Script terlebih dahulu!');
      return;
    }

    localStorage.setItem('SIKAD_SHEET_URL', url);
    const statusEl = document.getElementById('sheet-sync-status');
    if (statusEl) {
      statusEl.innerText = 'Mengirim data ke Google Spreadsheet... Mohon tunggu...';
    }

    const payload = {
      timestamp: new Date().toISOString(),
      tpaInfo: window.db.getTPAInfo(),
      students: window.db.getStudents(),
      sppRecords: window.db.data.sppRecords || [],
      transactions: window.db.getTransactions()
    };

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;">✓ Berhasil Disinkronkan:</span> Data (${payload.students.length} santri, ${payload.sppRecords.length} record SPP) telah dikirim ke Google Sheets pada ${new Date().toLocaleTimeString('id-ID')}.`;
      }
      this.showToast('Alhamdulillah! Data sukses dikirim ke Google Sheets.');
    } catch (err) {
      console.error('Gagal sinkron Google Sheets:', err);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #dc2626; font-weight: 700;">✕ Kendala Sinkronisasi:</span> ${err.message}`;
      }
      alert('Kendala mengirim ke Google Sheets: ' + err.message);
    }
  }

  copyGoogleScriptCode() {
    const el = document.getElementById('google-apps-script-code');
    const code = el ? el.innerText : '';
    if (!code) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast('📋 Kode Apps Script berhasil disalin ke clipboard!');
      }).catch(() => {
        this.showToast('Silakan pilih dan salin kode dari kotak di atas.');
      });
    } else {
      this.showToast('Silakan pilih dan salin kode dari kotak di atas.');
    }
  }

  downloadCsvTemplate() {
    const headers = ['NIS', 'Nama Santri', 'Kelas', 'Nama Wali', 'No WhatsApp', 'Tarif SPP', 'Beasiswa (Ya/Tidak)'];
    const rows = [
      ['202611', 'Ahmad Fauzan', 'Kelas 1: Jilid 1 - 2', 'Bpk. Ridwan', '081234567890', '50000', 'Tidak'],
      ['202612', 'Aisyah Putri', 'Kelas 2: Jilid 3 - 4', 'Ibu Fatimah', '081298765432', '50000', 'Tidak'],
      ['202613', 'Muhammad Bilal', "Kelas 3: Al-Qur'an & Tahsin", 'Bpk. Usman', '081345678901', '0', 'Ya']
    ];
    let csv = headers.map(h => this.escapeCsvCell(h)).join(',') + '\r\n';
    rows.forEach(r => {
      csv += r.map(c => this.escapeCsvCell(c)).join(',') + '\r\n';
    });
    this.downloadCsv('Template_Impor_Santri_SikadTPA.csv', csv);
    this.showToast('Template CSV Santri berhasil diunduh!');
  }

  handleImportCsv(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          alert('File CSV kosong atau tidak memiliki baris data santri.');
          return;
        }

        const parseCsvLine = (line) => {
          const cells = [];
          let current = '';
          let insideQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (insideQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                insideQuotes = !insideQuotes;
              }
            } else if (char === ',' && !insideQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          return cells;
        };

        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (cols.length < 2 || !cols[1]) continue;

          let nis = cols[0] || '';
          let name = cols[1] || '';
          let stdClass = cols[2] || 'Kelas 1: Jilid 1 - 2';
          let parent = cols[3] || ('Wali ' + name);
          let phone = cols[4] || '6281234567890';
          let spp = cols[5] ? Number(cols[5].replace(/\D/g, '')) : 50000;
          let isScholar = cols[6] ? (cols[6].toLowerCase().includes('ya') || cols[6].toLowerCase().includes('true')) : false;

          let cleanPhone = String(phone).replace(/\D/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
          else if (cleanPhone && !cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;
          if (!cleanPhone) cleanPhone = '6281234567890';

          window.db.addStudent({
            nis: nis || undefined,
            name: name,
            class: stdClass,
            parent: parent,
            phone: cleanPhone,
            sppAmount: isScholar ? 0 : spp,
            isScholarship: isScholar
          });
          successCount++;
        }

        this.renderAll();
        this.closeModal('modal-spreadsheet');
        event.target.value = '';
        this.showToast(`Alhamdulillah! Berhasil mengimpor ${successCount} santri dari file CSV.`);
      } catch (err) {
        console.error('Gagal mengimpor file CSV:', err);
        alert('Terjadi kesalahan saat memproses file CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  // =========================================================================
  // FITUR AUTO-UPDATE DATA SANTRI DARI LINK FORMULIR WALI
  // =========================================================================
  checkUrlAutoUpdate() {
    try {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('update_santri') || params.get('sync_santri') || params.get('id');
      const newParent = params.get('parent') || params.get('wali');
      const newPhone = params.get('phone') || params.get('hp');
      const newFullName = params.get('fullName') || params.get('full_name') || params.get('nama_lengkap') || params.get('namaLengkap');

      if (studentId && (newParent || newPhone || newFullName)) {
        const student = window.db.getStudents().find(s => s.id === studentId || s.nis === studentId);
        if (student) {
          const oldParent = student.parent;
          const oldPhone = student.phone;
          const cleanParent = newParent ? decodeURIComponent(newParent).trim() : student.parent;
          const cleanPhone = newPhone ? decodeURIComponent(newPhone).trim() : student.phone;
          const cleanFullName = newFullName ? decodeURIComponent(newFullName).trim() : (student.fullName || '');

          const updatePayload = {
            parent: cleanParent,
            phone: cleanPhone
          };
          if (cleanFullName) {
            updatePayload.name = cleanFullName; // Otomatis langsung mengubah nama panggilan di apk
            updatePayload.fullName = cleanFullName;
            if (!student.nickname) {
              updatePayload.nickname = student.name; // Simpan rekam jejak nama panggilan awal
            }
          }

          window.db.updateStudent(student.id, updatePayload);

          // Segarkan tampilan antarmuka
          this.renderAll();

          // Tampilkan notifikasi toast & dialog sukses
          const displayName = cleanFullName || student.name;
          this.showToast(`🎉 Data santri ${displayName} berhasil diperbarui otomatis.`);
          this.showAutoUpdateSuccessModal(student, cleanParent, cleanPhone, oldParent, oldPhone, cleanFullName);

          // Bersihkan URL query parameter agar rapi
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.error("Gagal auto-update data santri dari URL:", e);
    }
  }

  showAutoUpdateSuccessModal(student, newParent, newPhone, oldParent, oldPhone, newFullName = '') {
    const modal = document.getElementById('modal-auto-update-success');
    if (!modal) return;
    const infoEl = document.getElementById('auto-update-info-text');
    if (infoEl) {
      const activeName = newFullName || student.name;
      const initialNickname = student.nickname || (newFullName && newFullName !== student.name ? student.name : '');
      infoEl.innerHTML = `
        <div style="background: var(--success-bg); border: 1.5px solid #86efac; border-radius: 14px; padding: 16px; margin: 16px 0; text-align: left;">
          <div style="font-weight: 800; font-size: 1.05rem; color: #166534; margin-bottom: 8px;">
            👦 ${activeName} <span style="font-size: 0.8rem; font-weight: 600; color: #047857;">(${student.class})</span>
          </div>
          <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
            <tr>
              <td style="color: var(--slate-500); width: 140px; padding: 4px 0;">Nama Santri di Apk:</td>
              <td style="font-weight: 800; color: #1e3a8a; padding: 4px 0;">${activeName}</td>
            </tr>
            ${initialNickname ? `
            <tr>
              <td style="color: var(--slate-500); width: 140px; padding: 4px 0;">Nama Panggilan Awal:</td>
              <td style="color: #64748b; padding: 4px 0;">${initialNickname}</td>
            </tr>` : ''}
            <tr>
              <td style="color: var(--slate-500); width: 140px; padding: 4px 0;">Nama Orang Tua:</td>
              <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">${newParent}</td>
            </tr>
            <tr>
              <td style="color: var(--slate-500); padding: 4px 0;">No. WhatsApp:</td>
              <td style="font-weight: 700; color: #0f172a; font-family: monospace; padding: 4px 0;">${newPhone}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 0.78rem; color: var(--slate-500); line-height: 1.5; margin: 0;">
          Nama santri di aplikasi telah otomatis diganti dengan Nama Lengkap tanpa perlu diedit manual.
        </p>
      `;
    }
    this.openModal('modal-auto-update-success');
  }

  // =========================================================================
  // GENERATOR LINK FORMULIR WALI UNTUK 36 SANTRI
  // =========================================================================
  getStudentFormBaseUrl() {
    let host = window.location.origin;
    if (host.startsWith('file:') || host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'https://ummul-qosim-keuangan.vercel.app';
    }
    return host;
  }

  getStudentFormUrl(studentId) {
    const baseUrl = this.getStudentFormBaseUrl();
    return `${baseUrl}/isi-data.html?id=${encodeURIComponent(studentId)}`;
  }

  openStudentLinksModal(selectedClass = 'all') {
    const modal = document.getElementById('modal-student-links');
    if (!modal) return;

    this.switchStudentLinkTab('links');

    const filterSelect = document.getElementById('student-links-filter-class');
    if (filterSelect) filterSelect.value = selectedClass;

    this.renderStudentLinksList(selectedClass);
    this.populateQuickInputStudentDropdown();
    this.openModal('modal-student-links');
  }

  switchStudentLinkTab(tab) {
    const btnLinks = document.getElementById('btn-tab-link-gen');
    const btnQuick = document.getElementById('btn-tab-link-quick');
    const secLinks = document.getElementById('section-student-links');
    const secQuick = document.getElementById('section-student-quick-input');

    if (tab === 'links') {
      if (btnLinks) { btnLinks.classList.add('active'); btnLinks.classList.remove('btn-secondary'); }
      if (btnQuick) { btnQuick.classList.remove('active'); btnQuick.classList.add('btn-secondary'); }
      if (secLinks) secLinks.style.display = 'block';
      if (secQuick) secQuick.style.display = 'none';
    } else {
      if (btnLinks) { btnLinks.classList.remove('active'); btnLinks.classList.add('btn-secondary'); }
      if (btnQuick) { btnQuick.classList.add('active'); btnQuick.classList.remove('btn-secondary'); }
      if (secLinks) secLinks.style.display = 'none';
      if (secQuick) secQuick.style.display = 'block';
    }
  }

  populateQuickInputStudentDropdown() {
    const select = document.getElementById('quick-input-student-id');
    if (!select) return;
    const students = window.db.getStudents();
    select.innerHTML = '<option value="">-- Silakan Pilih Santri --</option>' +
      students.map(s => `<option value="${s.id}">${s.name} (${s.class})</option>`).join('');
  }

  onQuickInputStudentSelect(studentId) {
    if (!studentId) return;
    const student = window.db.getStudent(studentId);
    if (!student) return;

    const fnInput = document.getElementById('quick-input-child-fullname');
    const pInput = document.getElementById('quick-input-parent-name');
    const phInput = document.getElementById('quick-input-parent-phone');

    if (fnInput) fnInput.value = student.fullName || '';
    if (pInput) pInput.value = (student.parent && !student.parent.startsWith('Wali ')) ? student.parent : '';
    if (phInput) phInput.value = student.phone || '';
  }

  saveQuickInputStudent() {
    const select = document.getElementById('quick-input-student-id');
    const studentId = select ? select.value : '';
    if (!studentId) {
      alert('Silakan pilih nama santri terlebih dahulu.');
      return;
    }

    const student = window.db.getStudent(studentId);
    if (!student) return;

    const fullName = document.getElementById('quick-input-child-fullname')?.value.trim();
    const parent = document.getElementById('quick-input-parent-name')?.value.trim();
    let phone = document.getElementById('quick-input-parent-phone')?.value.trim() || '';

    if (!fullName) {
      alert('Mohon isi nama lengkap anak.');
      document.getElementById('quick-input-child-fullname')?.focus();
      return;
    }
    if (!parent) {
      alert('Mohon isi nama lengkap orang tua / wali.');
      document.getElementById('quick-input-parent-name')?.focus();
      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('62') && cleanPhone) cleanPhone = '62' + cleanPhone;

    window.db.updateStudent(student.id, {
      name: fullName, // Otomatis langsung mengubah nama panggilan di apk menjadi nama lengkap
      fullName: fullName,
      nickname: student.nickname || student.name,
      parent: parent,
      phone: cleanPhone || student.phone
    });

    this.renderAll();
    this.renderStudentLinksList();
    this.showToast(`✅ Data santri ${fullName} berhasil disimpan ke apk!`);
    this.closeModal('modal-student-links');
  }

  renderStudentLinksList(classFilter = 'all') {
    const container = document.getElementById('student-links-list-body');
    if (!container) return;

    const students = window.db.getStudents();
    const filtered = classFilter === 'all' 
      ? students 
      : students.filter(s => this.normalizeClassKey(s.class) === classFilter);

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--slate-400);">Tidak ada santri di kelas ini.</div>`;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const link = this.getStudentFormUrl(s.id);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--slate-100); gap: 10px; flex-wrap: wrap;">
          <div style="min-width: 170px; flex: 1;">
            <div style="font-weight: 700; color: var(--slate-900); font-size: 0.88rem;">${s.name}</div>
            ${s.fullName && s.fullName !== s.name ? `<div style="font-size: 0.72rem; color: var(--primary-700); font-weight: 600;">${s.fullName}</div>` : ''}
            <div style="font-size: 0.72rem; color: var(--slate-500);">${s.class} • NIS: ${s.nis}</div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="app.copyStudentFormLink('${s.id}')" title="Salin Tautan Khusus ${s.name}">
              📋 Salin Link
            </button>
            <button type="button" class="btn btn-whatsapp btn-sm" onclick="app.openStudentFormWa('${s.id}')" title="Kirim Tautan ke WhatsApp">
              📲 Kirim WA
            </button>
          </div>
        </div>
      `;
    }).join('');

    const countBadge = document.getElementById('student-links-count-badge');
    if (countBadge) countBadge.innerText = `${filtered.length} Santri`;
  }

  copyStudentFormLink(studentId) {
    const student = window.db.getStudents().find(s => s.id === studentId);
    if (!student) return;

    const link = this.getStudentFormUrl(student.id);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nMohon kesediaan Ayah/Bunda dari ananda *${student.name}* (${student.class}) untuk melengkapi nama lengkap ananda, nama orang tua, dan nomor telepon melalui formulir ringkas RQ Ummul Qosim berikut:\n\n👉 ${link}\n\n(Hanya perlu mengisi Nama Lengkap Anak, Nama Orang Tua, & No. HP)\nJazaakumullahu khairan katsiran.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showToast(`✅ Link formulir ${student.name} berhasil disalin!`);
      }).catch(() => {
        this.fallbackCopyText(textToCopy);
        this.showToast(`✅ Link formulir ${student.name} berhasil disalin!`);
      });
    } else {
      this.fallbackCopyText(textToCopy);
      this.showToast(`✅ Link formulir ${student.name} berhasil disalin!`);
    }
  }

  openStudentFormWa(studentId) {
    const student = window.db.getStudents().find(s => s.id === studentId);
    if (!student) return;

    const link = this.getStudentFormUrl(student.id);
    const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nMohon kesediaan Ayah/Bunda dari ananda *${student.name}* (${student.class}) untuk melengkapi nama lengkap ananda, nama orang tua, dan nomor telepon melalui formulir ringkas RQ Ummul Qosim berikut:\n\n👉 ${link}\n\n(Hanya perlu mengisi Nama Lengkap Anak, Nama Orang Tua, & No. HP)\nJazaakumullahu khairan katsiran.`;

    let targetPhone = student.phone ? student.phone.replace(/[^\d]/g, '') : '';
    if (targetPhone.startsWith('0')) targetPhone = '62' + targetPhone.slice(1);

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  }

  copyAllStudentFormLinks(classFilter = 'all') {
    const students = window.db.getStudents();
    const filtered = classFilter === 'all' 
      ? students 
      : students.filter(s => this.normalizeClassKey(s.class) === classFilter);

    let output = `DAFTAR TAUTAN FORMULIR WALI SANTRI RQ UMMUL QOSIM\n`;
    output += `Total: ${filtered.length} Santri\n(Orang tua cukup isi: Nama Lengkap Anak, Nama Orang Tua, & No. HP)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    filtered.forEach((s, idx) => {
      const link = this.getStudentFormUrl(s.id);
      output += `${idx + 1}. ${s.name} (${s.class})\n   👉 ${link}\n\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output).then(() => {
        this.showToast(`✅ Berhasil menyalin ${filtered.length} link formulir santri!`);
      }).catch(() => {
        this.fallbackCopyText(output);
        this.showToast(`✅ Berhasil menyalin ${filtered.length} link formulir santri!`);
      });
    } else {
      this.fallbackCopyText(output);
      this.showToast(`✅ Berhasil menyalin ${filtered.length} link formulir santri!`);
    }
  }

  fallbackCopyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      console.warn("Fallback copy error:", e);
    }
  }
}

// Inisialisasi Aplikasi Terpadu (Aman & Siap di Semua State Dokumen)
function initSikadApp() {
  if (!window.app) {
    window.app = new SikadApp();
    app = window.app;
  }
  return window.app;
}

// Inisialisasi cepat tanpa bergantung pada timing DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSikadApp);
} else {
  initSikadApp();
}
window.addEventListener('load', initSikadApp);

// =========================================================================
// GLOBAL ACTION WRAPPERS (Tahan banting terhadap pemanggilan inline HTML)
// =========================================================================
window.openStudentModal = function(defaultClass = null) {
  const inst = window.app || initSikadApp();
  if (inst) inst.openStudentModal(defaultClass);
};
window.openTeacherModal = function() {
  const inst = window.app || initSikadApp();
  if (inst) inst.openTeacherModal();
};
window.openTxModal = function(type = 'in', wallet = 'ops') {
  const inst = window.app || initSikadApp();
  if (inst) inst.openTxModal(type, wallet);
};
window.openSavingsModal = function(actionType = 'Setor', studentId = null) {
  const inst = window.app || initSikadApp();
  if (inst) inst.openSavingsModal(actionType, studentId);
};
window.openInfaqModal = function() {
  const inst = window.app || initSikadApp();
  if (inst) inst.openInfaqModal();
};
window.openExpenseModal = function() {
  const inst = window.app || initSikadApp();
  if (inst) inst.openExpenseModal();
};
window.openQRISModal = function() {
  const inst = window.app || initSikadApp();
  if (inst) inst.openQRISModal();
};
window.openSpreadsheetModal = function() {
  const inst = window.app || initSikadApp();
  if (inst) inst.openSpreadsheetModal();
};
window.openPaySppModal = function(studentId, monthStr) {
  const inst = window.app || initSikadApp();
  if (inst) inst.openPaySppModal(studentId, monthStr);
};
window.closeModal = function(modalId) {
  const inst = window.app || initSikadApp();
  if (inst) inst.closeModal(modalId);
};
window.submitStudent = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitStudent(e);
};
window.submitTeacher = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitTeacher(e);
};
window.submitTx = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitTx(e);
};
window.submitSavings = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitSavings(e);
};
window.submitPaySpp = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitPaySpp(e);
};
window.switchTab = function(tabId) {
  const inst = window.app || initSikadApp();
  if (inst) inst.switchTab(tabId);
};
window.openEditClassModal = function(classId) {
  const inst = window.app || initSikadApp();
  if (inst) inst.openEditClassModal(classId);
};
window.submitEditClass = function(e) {
  const inst = window.app || initSikadApp();
  if (inst) return inst.submitEditClass(e);
};
window.setEditClassIcon = function(emoji) {
  const inst = window.app || initSikadApp();
  if (inst) inst.setEditClassIcon(emoji);
};
window.openStudentLinksModal = function(classId = 'all') {
  const inst = window.app || initSikadApp();
  if (inst) inst.openStudentLinksModal(classId);
};
window.copyStudentFormLink = function(studentId) {
  const inst = window.app || initSikadApp();
  if (inst) inst.copyStudentFormLink(studentId);
};
window.openStudentFormWa = function(studentId) {
  const inst = window.app || initSikadApp();
  if (inst) inst.openStudentFormWa(studentId);
};
window.copyAllStudentFormLinks = function(classFilter = 'all') {
  const inst = window.app || initSikadApp();
  if (inst) inst.copyAllStudentFormLinks(classFilter);
};

