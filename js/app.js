/**
 * app.js - Main Application Logic & UI Controller untuk SikadTPA
 */

class SikadApp {
  constructor() {
    this.currentTab = 'tab-dashboard';
    this.currentReceipt = null;
    this.sppView = 'cards';
    this.sppQuickFilter = 'all';
    this.currentWaMsg = '';
    this.currentWaPhone = '';
    this.enteredPin = '';
    this.init();
  }

  init() {
    this.initSecurityPinGate();
    this.initTheme();
    this.bindEvents();
    this.initCommandPalette();
    this.loadTPAInfoToUI();
    this.renderAll();
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

    // Modal Catat Kas Shortcut
    const btnOpenTx = document.getElementById('btn-open-tx-modal');
    if (btnOpenTx) {
      btnOpenTx.addEventListener('click', () => {
        this.openTxModal('in', 'ops');
      });
    }

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
    this.renderDashboard();
    this.renderSppTable();
    this.renderSavings();
    this.renderInfaq();
    this.renderExpenses();
    this.generateReport();
    this.renderMasterData();
  }

  loadTPAInfoToUI() {
    const info = window.db.getTPAInfo();
    if (!info) return;

    // Sidebar Branding & User
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

    // Modal QRIS & Receipt
    const qrisName = document.getElementById('qris-tpa-name');
    if (qrisName) qrisName.innerText = (info.nama || 'TPA').toUpperCase();

    const rcpName = document.getElementById('rcp-tpa-name');
    if (rcpName) rcpName.innerText = (info.nama || 'TPA').toUpperCase();

    const repSignTitleKetua = document.getElementById('rep-sign-title-ketua');
    if (repSignTitleKetua) repSignTitleKetua.innerText = `Ketua ${info.nama}`;

    // Master settings inputs (tab Santri & Ustadz)
    const elName = document.getElementById('info-tpa-name');
    if (elName) elName.value = info.nama || '';

    const elMasjid = document.getElementById('info-tpa-masjid');
    if (elMasjid) elMasjid.value = info.masjid || '';

    const elAlamat = document.getElementById('info-tpa-alamat');
    if (elAlamat) elAlamat.value = info.alamat || '';

    const elRekening = document.getElementById('info-tpa-rekening');
    if (elRekening) elRekening.value = info.rekening || '';

    const elKetua = document.getElementById('info-tpa-ketua');
    if (elKetua) elKetua.value = info.ketua || '';

    const elBendahara = document.getElementById('info-tpa-bendahara');
    if (elBendahara) elBendahara.value = info.bendahara || '';

    const elPin = document.getElementById('info-tpa-pin');
    if (elPin) elPin.value = window.db.getSecurityPin() || '060708';
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

    const pctOps = Math.round((opsW.balance / safeTotal) * 100);
    const pctTabungan = Math.round((tabunganW.balance / safeTotal) * 100);
    const pctInfaq = Math.round((infaqW.balance / safeTotal) * 100);
    const pctBangun = Math.max(0, 100 - (pctOps + pctTabungan + pctInfaq));

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
    const currentMonth = '2026-09';
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
  // 2. MODUL SPP & SYAHRIAH (DUAL VIEW & SMART CAPSULES)
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

  renderSppTable() {
    const cardsContainer = document.getElementById('spp-cards-container');
    const tableContainer = document.getElementById('spp-table-container');
    const tbody = document.getElementById('spp-table-body');
    if (!tbody || !cardsContainer) return;

    const selectedMonth = document.getElementById('filter-spp-month')?.value || '2026-09';
    const searchQuery = document.getElementById('filter-spp-search')?.value.toLowerCase().trim() || '';
    const classFilter = document.getElementById('filter-spp-class')?.value || '';
    const statusFilter = document.getElementById('filter-spp-status')?.value || '';

    const allStudents = window.db.getStudents();

    // Calculate quick counts for capsule bar
    let countAll = allStudents.length;
    let countUnpaid = 0;
    let countPaid = 0;
    let countScholarship = 0;

    allStudents.forEach(s => {
      if (s.isScholarship) {
        countScholarship++;
      } else {
        const st = window.db.getSppStatus(s.id, selectedMonth);
        if (st.isPaid) countPaid++;
        else countUnpaid++;
      }
    });

    const elCountAll = document.getElementById('count-capsule-all');
    if (elCountAll) elCountAll.innerText = countAll;
    const elCountUnpaid = document.getElementById('count-capsule-unpaid');
    if (elCountUnpaid) elCountUnpaid.innerText = countUnpaid;
    const elCountPaid = document.getElementById('count-capsule-paid');
    if (elCountPaid) elCountPaid.innerText = countPaid;
    const elCountScholarship = document.getElementById('count-capsule-scholarship');
    if (elCountScholarship) elCountScholarship.innerText = countScholarship;

    // Filter students
    let filteredStudents = allStudents.filter(s => {
      const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
      const isPaid = sppStatus.isPaid;
      const statusLabel = isPaid ? 'Lunas' : 'Belum Lunas';

      // 1. Quick Filter Capsule
      if (this.sppQuickFilter === 'unpaid' && (s.isScholarship || isPaid)) return false;
      if (this.sppQuickFilter === 'paid' && (s.isScholarship || !isPaid)) return false;
      if (this.sppQuickFilter === 'scholarship' && !s.isScholarship) return false;

      // 2. Search Query
      if (searchQuery && !(s.name.toLowerCase().includes(searchQuery) || s.parent.toLowerCase().includes(searchQuery) || s.nis.includes(searchQuery))) {
        return false;
      }

      // 3. Class Filter
      if (classFilter && s.class !== classFilter) return false;

      // 4. Status Filter Dropdown
      if (statusFilter && statusFilter !== statusLabel) return false;

      return true;
    });

    // Toggle View Containers
    if (this.sppView === 'cards') {
      cardsContainer.style.display = 'grid';
      if (tableContainer) tableContainer.style.display = 'none';

      if (filteredStudents.length === 0) {
        cardsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--slate-400); background: var(--slate-50); border-radius: 18px; border: 1px dashed var(--border-color);">Tidak ada santri yang sesuai filter.</div>`;
      } else {
        cardsContainer.innerHTML = filteredStudents.map(s => {
          const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
          const isPaid = sppStatus.isPaid;
          const initials = s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

          let statusTag = '';
          let footerActions = '';

          if (s.isScholarship) {
            statusTag = `<span class="badge badge-warning">⭐ Beasiswa Yatim</span>`;
            footerActions = `<span style="font-size: 0.74rem; font-weight: 700; color: var(--gold-600); background: var(--gold-50); padding: 5px 12px; border-radius: var(--radius-full);">Bebas Syahriah</span>`;
          } else if (isPaid) {
            statusTag = `<span class="badge badge-success">✓ Lunas (${sppStatus.record.method})</span>`;
            footerActions = `
              <div style="display: flex; gap: 6px; width: 100%; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.showReceiptById('${sppStatus.record.id}')" title="Cetak Kuitansi Struk">
                  🧾 Kuitansi
                </button>
                <button type="button" class="btn btn-whatsapp btn-sm" onclick="app.openReceiptWaPreview('${s.id}', '${sppStatus.record.id}')" title="Preview & Kirim WA">
                  📲 WA
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.cancelSppPaymentPrompt('${sppStatus.record.id}')" title="Batalkan Pelunasan" style="color: var(--danger);">
                  ↩️
                </button>
              </div>
            `;
          } else {
            statusTag = `<span class="badge badge-danger">✕ Belum Lunas</span>`;
            footerActions = `
              <div style="display: flex; gap: 6px; width: 100%; justify-content: flex-end;">
                <button type="button" class="btn btn-primary btn-sm" onclick="app.openPaySppModal('${s.id}', '${selectedMonth}')">
                  💳 Bayar SPP
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.openReminderWaPreview('${s.id}', '${selectedMonth}')" title="Kirim Pesan Pengingat">
                  💬 Pengingat WA
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
                    <span class="lbl">Orang Tua / Wali</span>
                    <span class="val">${s.parent}</span>
                  </div>
                  <div class="std-detail-item">
                    <span class="lbl">Kontak WhatsApp</span>
                    <span class="val">${s.phone}</span>
                  </div>
                  <div class="std-detail-item">
                    <span class="lbl">Nominal SPP</span>
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
        }).join('');
      }
    } else {
      cardsContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';

      if (filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 24px;">Tidak ada data santri yang sesuai filter.</td></tr>`;
      } else {
        tbody.innerHTML = filteredStudents.map(s => {
          const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
          const isPaid = sppStatus.isPaid;
          let badgeHtml = '';
          let actionButtons = '';

          if (s.isScholarship) {
            badgeHtml = `<span class="badge badge-warning">⭐ Beasiswa Yatim</span>`;
            actionButtons = `<span style="font-size: 0.75rem; color: var(--slate-400);">Bebas Biaya</span>`;
          } else if (isPaid) {
            badgeHtml = `<span class="badge badge-success">✓ Lunas (${sppStatus.record.method})</span>`;
            actionButtons = `
              <div style="display: flex; gap: 6px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.showReceiptById('${sppStatus.record.id}')" title="Cetak Kuitansi">
                  🧾 Kuitansi
                </button>
                <button type="button" class="btn btn-whatsapp btn-sm" onclick="app.openReceiptWaPreview('${s.id}', '${sppStatus.record.id}')" title="Kirim WA">
                  📲 WA
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="app.cancelSppPaymentPrompt('${sppStatus.record.id}')" title="Batal">
                  ↩️
                </button>
              </div>
            `;
          } else {
            badgeHtml = `<span class="badge badge-danger">✕ Belum Lunas</span>`;
            actionButtons = `
              <div style="display: flex; gap: 6px; justify-content: flex-end;">
                <button type="button" class="btn btn-primary btn-sm" onclick="app.openPaySppModal('${s.id}', '${selectedMonth}')">
                  💳 Bayar SPP
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.openReminderWaPreview('${s.id}', '${selectedMonth}')" title="Pengingat WA">
                  💬 Pengingat WA
                </button>
              </div>
            `;
          }

          return `
            <tr>
              <td style="font-weight: 700; color: var(--slate-500);">${s.nis}</td>
              <td><div style="font-weight: 700; color: var(--slate-900);">${s.name}</div></td>
              <td><span class="badge badge-neutral">${s.class}</span></td>
              <td>
                <div style="font-size: 0.82rem;">${s.parent}</div>
                <div style="font-size: 0.72rem; color: var(--slate-400);">${s.phone}</div>
              </td>
              <td style="font-weight: 700;">${this.formatRp(s.sppAmount)}</td>
              <td>${badgeHtml}</td>
              <td style="text-align: right;">${actionButtons}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const summaryEl = document.getElementById('spp-filter-summary');
    if (summaryEl) summaryEl.innerText = `Menampilkan ${filteredStudents.length} Santri`;
  }

  // Buka Modal Bayar SPP
  openPaySppModal(studentId, monthStr) {
    const student = window.db.getStudent(studentId);
    if (!student) return;

    document.getElementById('pay-student-id').value = student.id;
    document.getElementById('pay-student-name').value = `${student.name} (${student.class})`;
    document.getElementById('pay-spp-month').value = this.formatMonthId(monthStr);
    document.getElementById('pay-spp-amount').value = student.sppAmount;
    
    // Store raw month in form dataset
    document.getElementById('form-pay-spp').dataset.rawMonth = monthStr;

    this.openModal('modal-pay-spp');
  }

  submitPaySpp(e) {
    e.preventDefault();
    const studentId = document.getElementById('pay-student-id').value;
    const monthStr = document.getElementById('form-pay-spp').dataset.rawMonth;
    const amount = Number(document.getElementById('pay-spp-amount').value);
    const method = document.getElementById('pay-spp-method').value;

    const record = window.db.paySpp(studentId, monthStr, amount, method);
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
      this.showToast('📋 Pesan WhatsApp berhasil disalin!');
    }).catch(() => {
      this.showToast('Pesan siap digunakan.');
    });
  }

  // WhatsApp Integration: Kirim Pengingat SPP
  openReminderWaPreview(studentId, monthStr) {
    const student = window.db.getStudent(studentId);
    const tpaInfo = window.db.getTPAInfo();
    if (!student) return;

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

  // WhatsApp Integration: Kirim Bukti Kwitansi Lunas
  openReceiptWaPreview(studentId, recordId) {
    const student = window.db.getStudent(studentId);
    const record = window.db.data.sppRecords.find(r => r.id === recordId);
    const tpaInfo = window.db.getTPAInfo();
    if (!student || !record) return;

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

    this.openWaPreviewModal(student.parent, student.phone, message);
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
    const searchQuery = document.getElementById('filter-savings-search')?.value.toLowerCase() || '';

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

  openSavingsModal(actionType, studentId = null) {
    document.getElementById('savings-action-type').value = actionType;
    document.getElementById('savings-modal-title').innerText = `${actionType} Tabungan Santri`;

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
    if (infaqWallet) document.getElementById('infaq-wallet-balance').innerText = this.formatRp(infaqWallet.balance);
    if (bangunWallet) document.getElementById('bangun-wallet-balance').innerText = this.formatRp(bangunWallet.balance);

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
          <td style="text-align: right;">
            <button class="btn btn-primary btn-sm" onclick="app.payTeacherBisyarahPrompt('${t.id}')">
              💵 Bayar Bisyarah
            </button>
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

    const confirmMsg = `Konfirmasi pembayaran Bisyarah untuk:\nNama: ${teacher.name}\nTugas: ${teacher.role}\nJumlah: ${this.formatRp(teacher.baseSalary)}\n\nDana akan dikurangi dari Kas Operasional. Lanjutkan?`;
    if (confirm(confirmMsg)) {
      try {
        const result = window.db.payBisyarah(teacherId, '2026-09', teacher.baseSalary, 'Bisyarah mengajar periode September 2026');
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
    const period = document.getElementById('report-period-select')?.value || '2026-09';
    const tpaInfo = window.db.getTPAInfo();
    const wallets = window.db.getWallets();

    // Set Kop Surat
    document.getElementById('rep-tpa-name').innerText = tpaInfo.nama;
    document.getElementById('rep-tpa-masjid').innerText = tpaInfo.masjid;
    document.getElementById('rep-tpa-address').innerText = `${tpaInfo.alamat} • Kontak: ${tpaInfo.kontak} • Rekening: ${tpaInfo.rekening}`;
    document.getElementById('rep-sign-ketua').innerText = tpaInfo.ketua;
    document.getElementById('rep-sign-bendahara').innerText = tpaInfo.bendahara;
    document.getElementById('rep-sign-date').innerText = this.formatDateId(new Date().toISOString().split('T')[0]);

    if (period === 'all') {
      document.getElementById('rep-subtitle').innerText = 'Periode: Semua Riwayat Transaksi';
    } else {
      document.getElementById('rep-subtitle').innerText = `Periode: ${this.formatMonthId(period)}`;
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

    document.getElementById('rep-total-in').innerText = this.formatRp(totalIn);
    document.getElementById('rep-total-out').innerText = this.formatRp(totalOut);
    
    const netFlowEl = document.getElementById('rep-net-flow');
    netFlowEl.innerText = this.formatRp(netFlow);
    netFlowEl.style.color = netFlow >= 0 ? 'var(--primary-700)' : 'var(--danger)';

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
    const tbody = document.getElementById('master-students-body');
    if (!tbody) return;

    const students = window.db.getStudents();
    tbody.innerHTML = students.map(s => `
      <tr>
        <td style="font-weight: 700; color: var(--slate-500);">${s.nis}</td>
        <td>
          <div style="font-weight: 700; color: var(--slate-900);">${s.name}</div>
          ${s.isScholarship ? '<span class="badge badge-info" style="font-size: 0.65rem;">Beasiswa Yatim</span>' : ''}
        </td>
        <td><span class="badge badge-neutral">${s.class}</span></td>
        <td>
          <div style="font-size: 0.8rem;">${s.parent}</div>
          <div style="font-size: 0.72rem; color: var(--slate-400);">${s.phone}</div>
        </td>
        <td style="font-weight: 700;">${this.formatRp(s.sppAmount)}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger btn-sm" onclick="app.deleteStudent('${s.id}')">Hapus</button>
        </td>
      </tr>
    `).join('');
  }

  openStudentModal() {
    document.getElementById('std-nis').value = '2026' + String(window.db.getStudents().length + 1).padStart(2, '0');
    document.getElementById('std-name').value = '';
    document.getElementById('std-parent').value = '';
    document.getElementById('std-phone').value = '628';
    document.getElementById('std-spp').value = '50000';
    document.getElementById('std-scholarship').checked = false;
    this.openModal('modal-student');
  }

  submitStudent(e) {
    e.preventDefault();
    const nis = document.getElementById('std-nis').value;
    const name = document.getElementById('std-name').value;
    const stdClass = document.getElementById('std-class').value;
    const parent = document.getElementById('std-parent').value;
    const phone = document.getElementById('std-phone').value;
    const sppAmount = Number(document.getElementById('std-spp').value);
    const isScholarship = document.getElementById('std-scholarship').checked;

    window.db.addStudent({
      nis,
      name,
      class: stdClass,
      parent,
      phone,
      sppAmount: isScholarship ? 0 : sppAmount,
      isScholarship
    });

    this.closeModal('modal-student');
    this.renderAll();
    alert(`Santri ${name} berhasil didaftarkan!`);
  }

  deleteStudent(id) {
    const student = window.db.getStudent(id);
    if (!student) return;
    if (confirm(`Yakin ingin menghapus santri ${student.name}?`)) {
      window.db.deleteStudent(id);
      this.renderAll();
    }
  }

  saveTpaInfo(e) {
    e.preventDefault();
    const pinVal = document.getElementById('info-tpa-pin')?.value || '060708';
    const newInfo = {
      nama: document.getElementById('info-tpa-name').value,
      masjid: document.getElementById('info-tpa-masjid').value,
      alamat: document.getElementById('info-tpa-alamat').value,
      rekening: document.getElementById('info-tpa-rekening').value,
      ketua: document.getElementById('info-tpa-ketua').value,
      bendahara: document.getElementById('info-tpa-bendahara').value,
      securityPin: pinVal
    };

    window.db.updateTPAInfo(newInfo);
    window.db.updateSecurityPin(pinVal);
    this.loadTPAInfoToUI();
    this.generateReport();
    this.showToast("Profil lembaga dan PIN keamanan (060708) berhasil disimpan!");
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
    document.getElementById('tx-type').value = type;
    document.getElementById('tx-wallet').value = defaultWallet;
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-category').value = '';
    document.getElementById('tx-desc').value = '';
    document.getElementById('modal-tx-title').innerText = type === 'in' ? 'Catat Kas Masuk (Penerimaan)' : 'Catat Kas Keluar (Pengeluaran)';
    this.openModal('modal-tx');
  }

  onTxTypeChange() {
    const type = document.getElementById('tx-type').value;
    document.getElementById('modal-tx-title').innerText = type === 'in' ? 'Catat Kas Masuk (Penerimaan)' : 'Catat Kas Keluar (Pengeluaran)';
  }

  submitTx(e) {
    e.preventDefault();
    const type = document.getElementById('tx-type').value;
    const walletId = document.getElementById('tx-wallet').value;
    const category = document.getElementById('tx-category').value;
    const amount = Number(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;
    const desc = document.getElementById('tx-desc').value;

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
    this.showToast(`Transaksi ${category} sebesar ${this.formatRp(amount)} berhasil disimpan!`);
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
    const query = document.getElementById('command-search-input')?.value.toLowerCase().trim() || '';
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
    if (screen) {
      screen.classList.toggle('unlocked', isUnlocked);
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
      msg.innerText = 'Masukkan PIN Keamanan Bendahara';
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
        if (screen) screen.classList.add('unlocked');
        this.enteredPin = '';
        this.updatePinDots();
        this.resetPinStatus();
        this.showToast('Selamat datang! Akses keuangan terbuka.');
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
    }
    this.clearPin();
    this.showToast('🔒 Sesi aplikasi telah dikunci.');
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
}

// Inisialisasi saat window dimuat
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SikadApp();
});
