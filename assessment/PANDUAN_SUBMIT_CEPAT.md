# ⚡ PANDUAN CEPAT SUBMIT (URGENT / EXPRESS)

Jika Anda sedang terburu-buru, ikuti 3 langkah kilat berikut ini:

---

### LANGKAH 1: Buat Pull Request di GitHub (1 Menit)

1. Branch `feature/monozukuri-revamp` **sudah berhasil ter-push** ke repository fork Anda (`Vannnd1/ai-interview-platform`).
2. Klik tautan langsung berikut untuk membuka halaman pembuatan PR:
   👉 **[Buka Halaman Pembuatan PR GitHub](https://github.com/rakamindev/ai-interview-platform/compare/main...Vannnd1:ai-interview-platform:feature/monozukuri-revamp?expand=1)**
3. **Judul PR**:
   ```text
   feat: Monozukuri revamp — fix data seam, unassessed skills, tenant isolation & dual DB migrations
   ```
4. **Deskripsi PR**:
   Buka berkas [assessment/PR_DESCRIPTION.md](file:///c:/Users/panpe/Downloads/projek_maganghub/assessment/PR_DESCRIPTION.md), salin seluruh isinya (Ctrl+A, Ctrl+C), lalu tempel ke kotak deskripsi PR di GitHub.
5. Klik tombol hijau **Create pull request**.
6. **Salin URL PR Anda** (misal: `https://github.com/rakamindev/ai-interview-platform/pull/1`).

---

### LANGKAH 2: Rekam Video Demonstrasi 3 Menit (3-4 Menit)

Gunakan Loom, OBS, atau rekaman Google Meet mandiri:
* **0:00 - 0:45**: Salam, sebutkan fokus perbaikan Monozukuri (Gap data seam, keadilan UU PDP unassessed skill, kebocoran multi-tenant).
* **0:45 - 1:45**: Tunjukkan kode di VS Code: berkas 2 migrasi database reversibel (`20260909000001` & `20260909000002`) dan `Gemini::HttpClient` JSON sanitizer.
* **1:45 - 2:30**: Tunjukkan tampilan web (`localhost:5173`): tabel Fit/Gap lengkap dengan badge status (`[Sesuai]`, `[Belum Dinilai]`, `[Override]`).
* **2:30 - 3:30**: Tunjukkan terminal: jalankan `npm test` di folder `web/` (hasil hijau 100% lolos), jelaskan Seeded Fault Test dan momen verifikasi AI.
* **Unggah video** ke Google Drive / YouTube (Unlisted) / Loom. Pastikan aksesnya diatur: **"Anyone with the link can view"** (Siapa saja yang memiliki tautan dapat melihat).

---

### LANGKAH 3: File yang Diunggah ke Portal Seleksi

* Berkas resmi yang diunggah ke portal Maganghub/Rakamin:
  📁 **`assessment/REPORT.pdf`**
  *(File ini sudah diperbarui dengan data pengujian otomatis RSpec & Vitest, skenario migrasi ganda, dan analisis kepatuhan UU PDP)*.
* Jika portal meminta kolom tautan terpisah:
  - Masukkan **Link PR GitHub** dari Langkah 1.
  - Masukkan **Link Video** dari Langkah 2.
