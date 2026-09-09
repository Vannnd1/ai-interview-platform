# Panduan Presentasi & Petunjuk Teknis Kandidat
*(Dokumen Internal Kandidat - Tidak Perlu Diserahkan ke Penilai)*

Dokumen ini disusun untuk membantu Anda menjalankan persiapan akhir: melakukan push kode ke GitHub, merekam video demonstrasi 3–5 menit, dan menyusun berkas pengumpulan ke Google Drive.

---

## 1. Petunjuk Unggah (Push) ke GitHub & Pembuatan Pull Request

Seluruh perubahan kode telah di-commit secara rapi pada branch `feature/monozukuri-revamp`. Commit terbaru adalah `fix: resolve critical assessor_overrides NULL violation and stale schema` yang mencakup 5 file perubahan:

| File | Perubahan |
|------|-----------|
| `api/db/schema.rb` | Versi `2026_09_09_000002`, ai_level nullable |
| `api/db/migrate/20260909000002_...rb` | Migrasi baru assessor_overrides |
| `api/app/models/assessor_override.rb` | `allow_nil: true` |
| `api/app/controllers/.../portfolio_skills_controller.rb` | Komentar NULL safety |
| `assessment/REPORT.md` | RSpec counts, dual migration docs |

### Langkah 1: Fork Repositori di Web GitHub
1. Buka peramban web dan pastikan telah masuk ke akun GitHub Anda (**Vannnd1**).
2. Kunjungi repositori resmi: `https://github.com/rakamindev/ai-interview-platform`
3. Klik tombol **Fork** di pojok kanan atas halaman, lalu klik tombol hijau **Create fork**.
4. Repositori salinan kini tersedia di akun Anda: `https://github.com/Vannnd1/ai-interview-platform`

### Langkah 2: Unggah (Push) Branch dari Laptop
Buka Terminal atau PowerShell di folder proyek ini, lalu jalankan perintah:

```bash
git push https://github.com/Vannnd1/ai-interview-platform.git feature/monozukuri-revamp
```

### Langkah 3: Buka Pull Request (PR)
1. Buka halaman repositori Anda di browser: `https://github.com/Vannnd1/ai-interview-platform`
2. Klik tombol hijau/kuning **Compare & pull request** yang muncul di bagian atas.
3. Pastikan pengaturan:
   - *Base repository*: `rakamindev/ai-interview-platform` (branch `main`)
   - *Head repository*: `Vannnd1/ai-interview-platform` (branch `feature/monozukuri-revamp`)
4. Masukkan judul PR:
   ```
   feat: Monozukuri revamp — fix data seam, unassessed skills, tenant isolation & dual DB migrations
   ```
5. Klik **Create pull request**.
6. Salin URL Pull Request tersebut untuk dimasukkan ke laporan.

---

## 2. Petunjuk Rekaman Video Demonstrasi (3 sampai 5 Menit)

Video demonstrasi berdurasi 3–5 menit ini dievaluasi oleh Tim Produk untuk menilai kejelasan pemahaman masalah dan hasil eksekusi produk.

### Persiapan Rekaman:
- **Aplikasi Perekam**: Gunakan Loom, OBS Studio, atau rekam rapat mandiri di Google Meet.
- **Target Durasi**: 3 menit 30 detik hingga 4 menit 30 detik (jangan melebihi batas 5 menit).
- **Jendela Layar yang Disiapkan** (buka semua sebelum mulai rekam):
  1. **Peramban web** — Aplikasi lokal pada halaman evaluasi Fit/Gap (`localhost:5173`) dan halaman kartu portofolio kandidat.
  2. **VS Code** — Buka berkas berikut di tab terpisah:
     - `api/db/migrate/20260909000001_allow_null_ai_level_for_unassessed_skills.rb`
     - `api/db/migrate/20260909000002_allow_null_ai_level_in_assessor_overrides.rb`
     - `api/app/services/fit_gap/engine.rb`
     - `api/app/clients/gemini/http_client.rb`
  3. **Terminal** — Siap menjalankan `npm test` di folder `web/`.

---

### Naskah Contekan Presenter (Menit demi Menit):

#### [Menit 0:00 – 0:45] Pembuka & Latar Belakang Masalah
- **Tampilan Layar**: Halaman web aplikasi lokal atau slide judul.
- **Poin Pembicaraan**:
  - Berikan salam pembuka kepada tim penilai Rakamin.
  - Sampaikan bahwa Anda melakukan penguatan menyeluruh (*Monozukuri revamp*) pada platform wawancara AI ini.
  - Jelaskan **3 temuan masalah paling kritis** yang ditemukan:
    1. **GAP-01**: Kolom standar lowongan pada tabel Fit/Gap kosong karena nama variabel backend (`expected_level`) dan frontend (`required_level`) tidak sesuai.
    2. **GAP-02**: Kompetensi yang belum sempat dibahas kandidat otomatis dipaksa menjadi Level 1 (gagal), melanggar prinsip keadilan UU PDP.
    3. **GAP-03**: Endpoint backend tidak memverifikasi tenant — pengguna Perusahaan A bisa mengakses data Perusahaan B.

#### [Menit 0:45 – 1:45] Penguatan Fondasi Backend & Basis Data
- **Tampilan Layar**: VS Code (berkas migrasi dan engine).
- **Poin Pembicaraan**:
  - Tunjukkan **dua migrasi basis data reversibel**:
    - Migrasi 1 (`20260909000001`): mengizinkan `NULL` pada `portfolio_skills.ai_level`.
    - Migrasi 2 (`20260909000002`): mengizinkan `NULL` pada `assessor_overrides.ai_level` — *bug berantai yang ditemukan saat code review* (tanpa ini, override pada unassessed skill akan crash `PG::NotNullViolation`).
  - Tunjukkan pengamanan kueri multi-tenant di controller — mengembalikan HTTP 404 untuk lintas-tenant.
  - Tunjukkan pembersih JSON markdown pada `Gemini::HttpClient` agar aplikasi tidak crash saat model mengirim respons berformat kode.

#### [Menit 1:45 – 2:45] Penyempurnaan Tampilan & Pengalaman Pengguna
- **Tampilan Layar**: Peramban web (Tabel Fit/Gap dan Kartu Portofolio).
- **Poin Pembicaraan**:
  - Tunjukkan tabel Fit/Gap yang kini terisi lengkap: level L1–L5, status (Sesuai, Melampaui, Kesenjangan, Belum Dinilai).
  - Tunjukkan indikator `[Override]` yang muncul saat penilai melakukan kalibrasi manual.
  - Tunjukkan kompetensi belum teruji berstatus "**Belum Dinilai**" bukan dicap gagal.
  - Tunjukkan kutipan bukti transkrip yang dapat dibuka-tutup (*View all / Collapse*).

#### [Menit 2:45 – 3:30] Pengujian Kualitas & Keandalan Rekayasa
- **Tampilan Layar**: Terminal laptop — eksekusi `npm test`.
- **Poin Pembicaraan**:
  - Tunjukkan hasil: **✅ 2 Test Files, 7 Tests — 100% Green**.
  - Jelaskan uji cacat sengaja (*Seeded Fault Test*): kode sengaja dirusak, tes langsung menangkap regresi secara akurat.
  - **Momen Verifikasi AI pertama**: AI sempat menyarankan `ai_level = 0` yang akan crash `PG::CheckViolation` — ditolak, solusi migrasi NULL dipilih.
  - **Momen Verifikasi AI kedua**: Saat review kode, ditemukan `assessor_overrides.ai_level NOT NULL` yang tidak terdeteksi di putaran pertama — diperbaiki dengan migrasi kedua.
  - Sebutkan juga RSpec backend: **4 file spec, 9 skenario** (generator, engine, tenant isolation, session model).

#### [Menit 3:30 – 4:00] Penutup
- **Tampilan Layar**: Repositori GitHub atau berkas laporan PDF.
- **Poin Pembicaraan**:
  - Seluruh kode tersimpan rapi di branch `feature/monozukuri-revamp` dan siap di-merge.
  - Platform kini menjadi sistem asesmen yang andal, berkeadilan, aman, dan siap pakai di industri.
  - Ucapkan terima kasih.

---

## 3. Daftar Berkas untuk Pengumpulan

Serahkan melalui portal platform perekrutan Rakamin atau Google Drive:

| No | Berkas | Lokasi |
|----|--------|--------|
| 1 | **REPORT.pdf** — Laporan teknis resmi | `assessment/REPORT.pdf` |
| 2 | **Video demonstrasi** (3–5 menit) | Unggah ke Google Drive / Loom / YouTube Unlisted |
| 3 | **Pull Request GitHub** | `https://github.com/rakamindev/ai-interview-platform/pull/...` |

> **Batas waktu**: Rabu, 19 Agustus — 13:00 WIB

---

## 4. Ringkasan Commit Terakhir (Referensi Cepat)

```
commit 1d051e8 — feature/monozukuri-revamp
fix: resolve critical assessor_overrides NULL violation and stale schema

Files changed (5):
  M  api/app/controllers/api/v1/portfolio_skills_controller.rb
  M  api/app/models/assessor_override.rb
  A  api/db/migrate/20260909000002_allow_null_ai_level_in_assessor_overrides.rb
  M  api/db/schema.rb
  M  assessment/REPORT.md
```

