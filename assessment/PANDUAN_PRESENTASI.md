# Panduan Presentasi & Petunjuk Teknis Kandidat
*(Dokumen Internal Kandidat - Tidak Perlu Diserahkan ke Penilai)*

Dokumen ini disusun untuk membantu Anda menjalankan persiapan akhir: melakukan push kode ke GitHub, merekam video demonstrasi 3–5 menit, dan menyusun berkas pengumpulan ke Google Drive.

---

## 1. Petunjuk Unggah (Push) ke GitHub & Pembuatan Pull Request

Seluruh perubahan kode telah di-commit secara rapi pada branch `feature/monozukuri-revamp`. Untuk membuat Pull Request resmi ke repositori Rakamin:

### Langkah 1: Fork Repositori di Web GitHub
1. Buka peramban web dan pastikan telah masuk ke akun GitHub Anda (**Vannnd1**).
2. Kunjungi repositori resmi: `https://github.com/rakamindev/ai-interview-platform`.
3. Klik tombol **Fork** di pojok kanan atas halaman, lalu klik tombol hijau **Create fork**.
4. Repositori salinan kini tersedia di akun Anda: `https://github.com/Vannnd1/ai-interview-platform`.

### Langkah 2: Unggah (Push) Branch dari Laptop
Buka Terminal atau PowerShell di folder proyek ini (`c:\Users\panpe\Downloads\projek_maganghub`), lalu jalankan perintah:
```bash
git push https://github.com/Vannnd1/ai-interview-platform.git feature/monozukuri-revamp
```

### Langkah 3: Buka Pull Request (PR)
1. Buka halaman repositori Anda di browser: `https://github.com/Vannnd1/ai-interview-platform`.
2. Klik tombol hijau/kuning **Compare & pull request** yang muncul di bagian atas.
3. Pastikan pengaturan:
   * *Base repository*: `rakamindev/ai-interview-platform` (branch `main`)
   * *Head repository*: `Vannnd1/ai-interview-platform` (branch `feature/monozukuri-revamp`)
4. Masukkan judul: `feat: Monozukuri revamp for AI interview platform (data seam, unassessed skills, tenant isolation)`.
5. Klik **Create pull request**.
6. Salin URL Pull Request tersebut untuk dimasukkan ke laporan atau pengumpulan.

---

## 2. Petunjuk Rekaman Video Demonstrasi (3 sampai 5 Menit)

Video demonstrasi berdurasi 3–5 menit ini dievaluasi oleh Tim Produk untuk menilai kejelasan pemahaman masalah dan hasil eksekusi produk.

### Persiapan Rekaman:
* **Aplikasi Perekam**: Gunakan Loom, OBS Studio, atau rekam rapat mandiri di Google Meet.
* **Target Durasi**: 3 menit 30 detik hingga 4 menit 30 detik (jangan melebihi batas 5 menit).
* **Jendela Layar yang Dibuka**:
  1. Peramban web: Aplikasi lokal pada halaman evaluasi Fit/Gap dan portofolio kandidat.
  2. VS Code: Menampilkan berkas `FitGap::Engine`, berkas migrasi database, dan pembersih JSON.
  3. Terminal: Menampilkan hasil eksekusi perintah `npm test` yang 100% lulus.

---

### Naskah Contekan Presenter (Menit demi Menit):

#### [Menit 0:00 - 0:45] Pembuka & Latar Belakang Masalah
* **Tampilan Layar**: Halaman web aplikasi lokal atau slide judul.
* **Poin Pembicaraan**:
  * Berikan salam pembuka kepada tim penilai Rakamin.
  * Sampaikan bahwa Anda melakukan penguatan menyeluruh (*Monozukuri revamp*) pada platform wawancara AI ini.
  * Jelaskan 2 temuan masalah paling kritis:
    1. Kolom standar lowongan pada tabel Fit/Gap kosong blank akibat perbedaan nama variabel backend dan frontend.
    2. Kompetensi yang belum sempat dibahas kandidat karena keterbatasan waktu otomatis dipaksa menjadi Level 1 (gagal), memicu penolakan sepihak yang tidak adil dan melanggar prinsip keadilan UU PDP.

#### [Menit 0:45 - 1:45] Penguatan Fondasi Backend & Basis Data
* **Tampilan Layar**: VS Code (`api/db/migrate/...`, `api/app/services/fit_gap/engine.rb`, `api/app/clients/gemini/http_client.rb`).
* **Poin Pembicaraan**:
  * Tunjukkan migrasi database yang mengizinkan nilai `NULL` untuk kompetensi yang belum diuji.
  * Tunjukkan pengamanan kueri multi-tenant di controller untuk mencegah kebocoran data antar-perusahaan (mengembalikan HTTP 404).
  * Tunjukkan pembersih teks markdown pada klien Gemini agar aplikasi tidak crash saat menerima balasan berformat kode.
  * Jelaskan penyensoran teks suara kandidat pada berkas log server demi mematuhi UU PDP.

#### [Menit 1:45 - 2:45] Penyempurnaan Tampilan & Pengalaman Pengguna
* **Tampilan Layar**: Peramban web (Tabel Fit/Gap dan Kartu Portofolio).
* **Poin Pembicaraan**:
  * Tunjukkan tabel perbandingan Fit/Gap yang kini terisi lengkap dengan level L1–L5 dan status hasil (Sesuai, Melampaui, Kesenjangan).
  * Tunjukkan indikator jelas jika penilai melakukan koreksi manual (*Override*).
  * Tunjukkan kompetensi yang belum teruji berstatus "Belum Dinilai", bukan dicap gagal.
  * Tunjukkan kutipan bukti transkrip percakapan yang kini dapat dibuka-tutup (*View all / Collapse*).

#### [Menit 2:45 - 3:30] Pengujian Kualitas & Keandalan Rekayasa
* **Tampilan Layar**: Terminal laptop saat mengeksekusi `npm test`.
* **Poin Pembicaraan**:
  * Tunjukkan rangkaian uji otomatis Vitest yang lulus 100% (7 tes dalam waktu 1.8 detik).
  * Jelaskan uji cacat sengaja (*Seeded Fault Test*): Anda membuktikan sensitivitas tes dengan sengaja merusak kode, dan tes otomatis langsung menangkap kesalahan tersebut secara akurat.
  * Jelaskan momen verifikasi AI: AI sempat menyarankan nilai default angka 0 yang berisiko membuat crash PostgreSQL (`PG::CheckViolation`), dan Anda mencegahnya dengan migrasi skema yang benar.

#### [Menit 3:30 - 4:00] Penutup
* **Tampilan Layar**: Repositori GitHub atau berkas laporan PDF.
* **Poin Pembicaraan**:
  * Sampaikan bahwa seluruh kode telah tersimpan rapi di branch `feature/monozukuri-revamp` dan siap di-merge.
  * Tegaskan bahwa platform kini menjadi sistem asesmen yang andal, berkeadilan, aman, dan siap pakai di industri.
  * Ucapkan terima kasih.

---

## 3. Daftar Berkas untuk Google Drive

Di folder Google Drive yang akan diserahkan ke pihak kantor, sertakan:
1. Berkas laporan resmi: `REPORT.pdf` (berada di folder `assessment/REPORT.pdf`).
2. Berkas rekaman video demonstrasi (`.mp4`) atau tautan video (Google Drive / Loom / YouTube Unlisted).
3. Tautan Pull Request GitHub dari branch `feature/monozukuri-revamp`.
