/**
 * app.js - Main Application Logic & UI Controller untuk SikadTPA
 */

class SikadApp {
  constructor() {
    this.currentTab = 'tab-dashboard';
    this.currentReceipt = null;
    this.init();
  }

  init() {
    this.bindEvents();
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
      'tab-master': { title: 'Master Data & Profil', desc: 'Kelola data santri, ustadz, dan identitas lembaga TPA' }
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
    document.getElementById('sidebar-tpa-name').innerText = info.nama;
    document.getElementById('sidebar-user-name').innerText = info.bendahara;
    
    // Master settings inputs
    document.getElementById('info-tpa-name').value = info.nama;
    document.getElementById('info-tpa-masjid').value = info.masjid;
    document.getElementById('info-tpa-alamat').value = info.alamat;
    document.getElementById('info-tpa-rekening').value = info.rekening;
    document.getElementById('info-tpa-ketua').value = info.ketua;
    document.getElementById('info-tpa-bendahara').value = info.bendahara;
  }

  // =========================================================================
  // 1. DASHBOARD CONTROLLER
  // =========================================================================
  renderDashboard() {
    const wallets = window.db.getWallets();
    const walletsContainer = document.getElementById('wallets-container');
    
    let totalAllBalances = 0;
    walletsContainer.innerHTML = wallets.map(w => {
      totalAllBalances += w.balance;
      const icons = {
        ops: '💼',
        tabungan: '💰',
        infaq: '🤲',
        bangun: '🕌'
      };
      return `
        <div class="wallet-card wallet-${w.id}">
          <div class="wallet-top">
            <div class="wallet-info">
              <h4>${w.name}</h4>
              <div class="wallet-balance">${this.formatRp(w.balance)}</div>
            </div>
            <div class="wallet-icon-box" style="font-size: 1.4rem;">
              ${icons[w.id] || '💳'}
            </div>
          </div>
          <div class="wallet-desc">${w.desc}</div>
        </div>
      `;
    }).join('');

    // Metrics calculation for current month (September 2026)
    const currentMonth = '2026-09';
    const txs = window.db.getTransactions();
    
    let incomeMonth = 0;
    let expenseMonth = 0;

    txs.forEach(t => {
      if (t.date.startsWith(currentMonth)) {
        if (t.type === 'in') incomeMonth += t.amount;
        if (t.type === 'out') expenseMonth += t.amount;
      }
    });

    document.getElementById('metric-income-month').innerText = this.formatRp(incomeMonth);
    document.getElementById('metric-expense-month').innerText = this.formatRp(expenseMonth);
    document.getElementById('metric-total-balance').innerText = this.formatRp(totalAllBalances);

    // SPP Metrics
    const students = window.db.getStudents();
    let paidCount = 0;
    let totalTarget = 0;
    let totalCollected = 0;

    students.forEach(s => {
      totalTarget += s.sppAmount;
      const status = window.db.getSppStatus(s.id, currentMonth);
      if (status.isPaid) {
        paidCount++;
        totalCollected += (status.record ? status.record.amount : 0);
      }
    });

    const unpaidCount = students.length - paidCount;
    document.getElementById('metric-spp-status').innerText = `${paidCount} / ${students.length} Santri`;
    document.getElementById('badge-unpaid-spp').innerText = unpaidCount;

    // SPP Progress Box
    const pct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 100;
    document.getElementById('spp-progress-percentage').innerText = `${pct}% Tercapai`;
    document.getElementById('spp-progress-fill').style.width = `${Math.min(pct, 100)}%`;
    document.getElementById('spp-progress-collected').innerText = `Terkumpul: ${this.formatRp(totalCollected)}`;
    document.getElementById('spp-progress-remaining').innerText = `Sisa Tunggakan: ${this.formatRp(totalTarget - totalCollected)}`;

    // Render 6-Month Cashflow Chart Mockup
    this.renderCashflowChart();

    // Render Recent Transactions
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
      listEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--slate-400); text-align: center; padding: 16px;">Belum ada transaksi</p>`;
      return;
    }

    const walletNames = {
      ops: 'Kas Operasional',
      tabungan: 'Kas Tabungan',
      infaq: 'Kas Infaq',
      bangun: 'Kas Pembangunan'
    };

    listEl.innerHTML = txs.map(t => {
      const isIncome = t.type === 'in';
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--slate-50); border-radius: var(--radius-md); border-left: 3px solid ${isIncome ? 'var(--primary-500)' : 'var(--danger)'};">
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--slate-800);">${t.category}</div>
            <div style="font-size: 0.72rem; color: var(--slate-500);">${this.formatDateId(t.date)} • <span style="color: var(--primary-700); font-weight: 600;">${walletNames[t.walletId] || t.walletId}</span></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; font-weight: 800; color: ${isIncome ? 'var(--primary-700)' : 'var(--danger)'};">
              ${isIncome ? '+' : '-'}${this.formatRp(t.amount)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. MODUL SPP & SYAHRIAH
  // =========================================================================
  renderSppTable() {
    const tbody = document.getElementById('spp-table-body');
    if (!tbody) return;

    const selectedMonth = document.getElementById('filter-spp-month')?.value || '2026-09';
    const searchQuery = document.getElementById('filter-spp-search')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('filter-spp-class')?.value || '';
    const statusFilter = document.getElementById('filter-spp-status')?.value || '';

    let students = window.db.getStudents();

    // Filters
    if (searchQuery) {
      students = students.filter(s => s.name.toLowerCase().includes(searchQuery) || s.parent.toLowerCase().includes(searchQuery) || s.nis.includes(searchQuery));
    }
    if (classFilter) {
      students = students.filter(s => s.class === classFilter);
    }

    let rowsHtml = '';
    let matchCount = 0;

    students.forEach(s => {
      const sppStatus = window.db.getSppStatus(s.id, selectedMonth);
      const isPaid = sppStatus.isPaid;
      const statusLabel = isPaid ? 'Lunas' : 'Belum Lunas';

      if (statusFilter && statusFilter !== statusLabel) {
        return;
      }
      matchCount++;

      let badgeHtml = '';
      let actionButtons = '';

      if (s.isScholarship) {
        badgeHtml = `<span class="badge badge-info">⭐ Beasiswa Yatim</span>`;
        actionButtons = `<span style="font-size: 0.75rem; color: var(--slate-400);">Bebas Biaya</span>`;
      } else if (isPaid) {
        badgeHtml = `<span class="badge badge-success">✓ Lunas (${sppStatus.record.method})</span>`;
        actionButtons = `
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="app.showReceiptById('${sppStatus.record.id}')" title="Cetak Kuitansi">
              🧾 Kuitansi
            </button>
            <button class="btn btn-whatsapp btn-sm" onclick="app.sendReceiptWA('${s.id}', '${sppStatus.record.id}')" title="Kirim WA Bukti Bayar">
              📲 Kirim WA
            </button>
          </div>
        `;
      } else {
        badgeHtml = `<span class="badge badge-danger">✕ Belum Lunas</span>`;
        actionButtons = `
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" onclick="app.openPaySppModal('${s.id}', '${selectedMonth}')">
              💳 Bayar SPP
            </button>
            <button class="btn btn-secondary btn-sm" onclick="app.sendSppReminderWA('${s.id}', '${selectedMonth}')" title="Kirim Pengingat WhatsApp">
              💬 Pengingat WA
            </button>
          </div>
        `;
      }

      rowsHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--slate-500);">${s.nis}</td>
          <td>
            <div style="font-weight: 700; color: var(--slate-900);">${s.name}</div>
          </td>
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
    });

    if (matchCount === 0) {
      rowsHtml = `<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 24px;">Tidak ada data santri yang sesuai filter.</td></tr>`;
    }

    tbody.innerHTML = rowsHtml;
    document.getElementById('spp-filter-summary').innerText = `Menampilkan ${matchCount} Santri`;
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

    document.getElementById('rcp-number').innerText = `No: ${record.receiptNo}`;
    document.getElementById('rcp-date').innerText = this.formatDateId(record.paidDate);
    document.getElementById('rcp-parent').innerText = student.parent;
    document.getElementById('rcp-student').innerText = student.name;
    document.getElementById('rcp-class').innerText = student.class;
    document.getElementById('rcp-for').innerText = `Syahriah / SPP Bulan ${this.formatMonthId(record.month)}`;
    document.getElementById('rcp-method').innerText = record.method;
    document.getElementById('rcp-amount').innerText = this.formatRp(record.amount);

    const btnWa = document.getElementById('btn-rcp-send-wa');
    btnWa.onclick = () => this.sendReceiptWA(student.id, record.id);

    this.openModal('modal-receipt');
  }

  showReceiptById(recordId) {
    const record = window.db.data.sppRecords.find(r => r.id === recordId);
    if (!record) return;
    const student = window.db.getStudent(record.studentId);
    this.showReceipt(record, student);
  }

  // WhatsApp Integration: Kirim Pengingat SPP
  sendSppReminderWA(studentId, monthStr) {
    const student = window.db.getStudent(studentId);
    const tpaInfo = window.db.getTPAInfo();
    if (!student) return;

    const monthFormatted = this.formatMonthId(monthStr);
    const message = 
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Bapak/Ibu Wali dari Ananda *${student.name}* (${student.class}),

Semoga Bapak/Ibu sekeluarga senantiasa dalam limpahan rahmat dan kesehatan dari Allah SWT.

Kami dari bagian administrasi & keuangan *${tpaInfo.nama}* menginformasikan mengenai kewajiban syahriah/SPP santri untuk bulan *${monthFormatted}* sebesar *${this.formatRp(student.sppAmount)}* yang saat ini belum tercatat lunas.

Pembayaran dapat ditunaikan melalui:
1. Tunai ke Bendahara di kantor TPA (${tpaInfo.bendahara})
2. Transfer Bank: *${tpaInfo.rekening}*

Konfirmasi pembayaran dapat dikirimkan ke nomor ini. Jazakumullah khairan katsiran atas kerja sama dan dukungan Bapak/Ibu demi kelancaran kegiatan belajar mengajar Al-Qur'an ananda.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
— Pengurus *${tpaInfo.nama}*`;

    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  // WhatsApp Integration: Kirim Bukti Kwitansi Lunas
  sendReceiptWA(studentId, recordId) {
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

    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  broadcastSppReminder() {
    alert("Fitur Pengingat WhatsApp Santri siap digunakan! Anda dapat mengklik tombol '💬 Pengingat WA' di samping nama setiap santri yang belum lunas untuk membuka pesan sopan otomatis langsung ke WhatsApp wali santri.");
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
    const newInfo = {
      nama: document.getElementById('info-tpa-name').value,
      masjid: document.getElementById('info-tpa-masjid').value,
      alamat: document.getElementById('info-tpa-alamat').value,
      rekening: document.getElementById('info-tpa-rekening').value,
      ketua: document.getElementById('info-tpa-ketua').value,
      bendahara: document.getElementById('info-tpa-bendahara').value
    };

    window.db.updateTPAInfo(newInfo);
    this.loadTPAInfoToUI();
    this.generateReport();
    alert("Profil dan identitas lembaga TPA berhasil diperbarui!");
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
    alert(`Transaksi ${category} sebesar ${this.formatRp(amount)} berhasil disimpan!`);
  }
}

// Inisialisasi saat window dimuat
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SikadApp();
});
