/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - SIKAD TPA RQ UMMUL QOSIM BACKEND SYNC
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN (Hanya 1 Menit):
 * 1. Buka Google Spreadsheet baru di https://sheets.google.com
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'
 * 3. Hapus semua kode bawaan, lalu Tempel (Paste) seluruh skrip di bawah ini
 * 4. Klik tombol 'Deploy' (Terapkan) di pojok kanan atas > 'New deployment' (Penerapan baru)
 * 5. Pilih jenis (ikon roda gigi): 'Web App' (Aplikasi Web)
 *    - Description: "SikadTPA Sync Backend"
 *    - Execute as: "Me (email Google Anda)"
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING agar HP & Laptop bisa terhubung
 * 6. Klik tombol 'Deploy', izinkan akses (Authorize Access jika diminta), lalu SALIN URL Web App yang berakhiran '/exec'.
 * 7. Masukkan URL tersebut ke aplikasi SikadTPA (Menu Master > Informasi Lembaga > URL Cloud Spreadsheet)
 *    atau tempel di Pengaturan. Laptop & HP akan langsung tersinkronisasi otomatis!
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var storeSheet = ss.getSheetByName("_DB_STORE");
    var masterJson = "";

    if (storeSheet && storeSheet.getLastRow() >= 1) {
      masterJson = storeSheet.getRange(1, 1).getValue();
    }

    if (!masterJson) {
      var props = PropertiesService.getScriptProperties();
      masterJson = props.getProperty("SIKAD_MASTER_DATA") || "";
    }

    var responseData = null;
    if (masterJson) {
      try {
        responseData = JSON.parse(masterJson);
      } catch (err) {
        responseData = null;
      }
    }

    var result = {
      status: "success",
      updatedAt: new Date().toISOString(),
      hasData: !!responseData,
      data: responseData
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    if (!raw) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data yang dikirim"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");

    // Ambil database master saat ini jika ada
    var currentDb = null;
    var storeSheet = ss.getSheetByName("_DB_STORE") || ss.insertSheet("_DB_STORE");
    if (storeSheet.getLastRow() >= 1) {
      var existingRaw = storeSheet.getRange(1, 1).getValue();
      if (existingRaw) {
        try { currentDb = JSON.parse(existingRaw); } catch(ex){}
      }
    }

    // KASUS 1: Pembaruan Mandiri Santri dari Formulir Orang Tua (isi-data.html)
    if (payload.action === "update_student_quick" && payload.studentId) {
      if (currentDb && Array.isArray(currentDb.students)) {
        var idx = currentDb.students.findIndex(function(s) { return s.id === payload.studentId; });
        if (idx !== -1) {
          currentDb.students[idx].nickname = currentDb.students[idx].nickname || currentDb.students[idx].name;
          currentDb.students[idx].name = payload.fullName || payload.name || currentDb.students[idx].name;
          currentDb.students[idx].fullName = payload.fullName || payload.name;
          currentDb.students[idx].parent = payload.parent || currentDb.students[idx].parent;
          currentDb.students[idx].phone = payload.phone || currentDb.students[idx].phone;
        }
      }
      payload = {
        action: "sync_full",
        data: currentDb
      };
    }

    // KASUS 2: Sinkronisasi Lengkap Database dari Aplikasi (Laptop / HP)
    var db = payload.data || payload;
    if (db && db.students) {
      // Simpan backup JSON terstruktur di sheet _DB_STORE
      storeSheet.clear();
      storeSheet.getRange(1, 1).setValue(JSON.stringify(db));
      PropertiesService.getScriptProperties().setProperty("SIKAD_MASTER_DATA", JSON.stringify(db));

      // --- SHEET 1: DATA SANTRI ---
      var sheetSantri = ss.getSheetByName("Data Santri") || ss.insertSheet("Data Santri");
      sheetSantri.clear();
      sheetSantri.appendRow(["ID", "NIS", "Nama Lengkap Santri", "Kelas / Jilid", "Nama Orang Tua / Wali", "No WhatsApp", "Tarif SPP (Rp)", "Status Beasiswa", "Saldo Tabungan (Rp)", "Sinkronisasi Terakhir"]);
      sheetSantri.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e2e8f0");

      if (Array.isArray(db.students)) {
        db.students.forEach(function(s) {
          sheetSantri.appendRow([
            s.id,
            s.nis || "-",
            s.fullName || s.name,
            s.class || "-",
            s.parent || "-",
            s.phone ? "'" + s.phone : "-",
            s.sppAmount || 0,
            s.isScholarship ? "Ya (Beasiswa)" : "Tidak",
            s.savingsBalance || 0,
            nowStr
          ]);
        });
      }

      // --- SHEET 2: REKAP SPP ---
      var sheetSpp = ss.getSheetByName("Rekap SPP") || ss.insertSheet("Rekap SPP");
      sheetSpp.clear();
      sheetSpp.appendRow(["ID Record", "Santri ID", "Bulan Tagihan", "Nominal (Rp)", "Tgl Bayar", "Status", "Metode", "No Kwitansi", "Diperbarui"]);
      sheetSpp.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e2e8f0");

      if (Array.isArray(db.sppRecords)) {
        db.sppRecords.forEach(function(r) {
          sheetSpp.appendRow([
            r.id,
            r.studentId,
            r.month,
            r.amount || 0,
            r.paidDate || "-",
            r.status === "paid" || r.status === "Lunas" ? "Lunas" : "Belum Lunas",
            r.method || "-",
            r.receiptNo || "-",
            nowStr
          ]);
        });
      }

      // --- SHEET 3: BUKU KAS ---
      var sheetKas = ss.getSheetByName("Buku Kas") || ss.insertSheet("Buku Kas");
      sheetKas.clear();
      sheetKas.appendRow(["ID Transaksi", "Tanggal", "Jenis Kas", "Kantong Rekening", "Kategori", "Nominal (Rp)", "Keterangan", "Waktu Catat"]);
      sheetKas.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e2e8f0");

      if (Array.isArray(db.transactions)) {
        db.transactions.forEach(function(t) {
          sheetKas.appendRow([
            t.id,
            t.date,
            t.type === "in" ? "Masuk" : "Keluar",
            t.walletId || "-",
            t.category || "-",
            t.amount || 0,
            t.desc || "-",
            nowStr
          ]);
        });
      }

      // --- SHEET 4: TABUNGAN SANTRI ---
      var sheetTabungan = ss.getSheetByName("Tabungan Santri") || ss.insertSheet("Tabungan Santri");
      sheetTabungan.clear();
      sheetTabungan.appendRow(["ID Mutasi", "Tanggal", "Santri ID", "Jenis Mutasi", "Nominal (Rp)", "Catatan", "Waktu"]);
      sheetTabungan.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e2e8f0");

      if (Array.isArray(db.savingsTransactions)) {
        db.savingsTransactions.forEach(function(m) {
          sheetTabungan.appendRow([
            m.id,
            m.date,
            m.studentId,
            m.type,
            m.amount || 0,
            m.note || "-",
            nowStr
          ]);
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil disimpan dan disinkronkan ke Spreadsheet!",
      timestamp: nowStr
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
