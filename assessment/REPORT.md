# Laporan Studi Kasus Product Engineer: Perbaikan Platform AI Interview
**Dokumen Laporan Teknis & Catatan Eksekusi Monozukuri**

---

## 1. Ringkasan Singkat & Tautan Penting

* **Repositori Asal**: `github.com/rakamindev/ai-interview-platform`
* **Branch Pengerjaan**: `feature/monozukuri-revamp`
* **Tautan Pull Request (PR) GitHub**: `https://github.com/rakamindev/ai-interview-platform/pull/1` *(atau link PR aktif repositori)*
* **Tautan Video Penjelasan (3-5 Menit)**: `[Tempelkan Link Video di Sini - Google Drive / Loom / YouTube Unlisted]`
* **Fokus Pengerjaan**: **Fullstack Seimbang (Sistem Backend Kokoh + Tampilan Web Rapi & Manusiawi)**
  * *Di sisi Backend*: Menutup celah keamanan data antar-perusahaan (multi-tenant), membuat migrasi database yang aman untuk data lama, menangani parsing output AI Gemini agar anti-crash, memperbaiki aturan validasi untuk skill yang belum diuji, serta membuat pengujian otomatis dengan RSpec.
  * *Di sisi Frontend*: Menyambungkan data tabel yang sempat putus, menampilkan tanda jika penilai mengubah nilai secara manual (`✏ override`), merapikan tampilan skill yang belum sempat dinilai agar tidak langsung dicap gagal, menambahkan fitur buka-tutup (expand/collapse) kutipan percakapan kandidat, serta melengkapi pengujian komponen dengan Vitest (100% lolos).

---

## 2. Memahami Produk & Industri Rekrutmen (5 Sudut Pandang)

Sebelum menulis kode perbaikan, kita perlu melihat gambaran besarnya:

### 2.1 Produk Apa Ini Sebenarnya?
Aplikasi ini adalah platform wawancara kerja berbasis suara menggunakan AI (Google Gemini). Cara kerjanya dinamis seperti wawancara manusia asli—bukan sekadar kuis pilihan ganda atau pencarian kata kunci di CV. AI mendengarkan jawaban kandidat secara langsung, memetakan kompetensi ke Level 1 sampai 5, lalu menyusun portofolio hasil wawancara yang dicocokkan dengan kebutuhan lowongan kerja perusahaan.

### 2.2 Tantangan Industri Rekrutmen di Indonesia
Perekrut di Indonesia sering kali kebanjiran ratusan hingga ribuan lamaran untuk satu posisi. Skrining CV manual sangat lambat dan rawan bias (misalnya hanya melihat nama kampus terkenal). Di sisi lain, tes koding pilihan ganda gampang dicurangi dan tidak memperlihatkan cara berpikir asli kandidat. Kekuatan utama platform ini ada pada kemampuannya menggali penalaran nyata: mengapa kandidat mengambil keputusan A dibanding B, dan bagaimana mereka mengatasi masalah di dunia kerja sesungguhnya.

### 2.3 Tujuan Utama Platform
Menghasilkan **sinyal penilaian yang bisa dipertanggungjawabkan**. Setiap nilai yang diberikan AI harus punya bukti kutipan langsung dari apa yang diucapkan kandidat selama wawancara. Kalau ada penilaian yang mengada-ada (halusinasi AI), perusahaan akan kehilangan kepercayaan dan karier kandidat bisa dirugikan.

### 2.4 Siapa Saja Penggunanya?
* **Perekrut & Penilai (Assessor)**: Butuh kepastian cepat apakah kandidat memenuhi kriteria lowongan tanpa harus mendengarkan rekaman audio 45 menit satu per satu. Mereka juga wajib punya kendali penuh untuk mengoreksi nilai AI jika dirasa kurang pas.
* **Hiring Manager**: Butuh laporan perbandingan yang jelas (mana skill yang cocok, mana yang kurang, dan bagaimana kecocokan budayanya) sebagai bekal wawancara tatap muka babak final.

### 2.5 Mereka yang Terdampak: Kandidat & Kepatuhan UU PDP
Kandidat tidak punya pilihan selain mengikuti sistem wawancara AI ini jika ingin melamar kerja. Kesalahan penilaian dari sistem bisa menggagalkan peluang karier seseorang.
Oleh karena itu, sesuai dengan **UU Perlindungan Data Pribadi (UU No. 27 Tahun 2022 - UU PDP)**:
1. **Prinsip Keadilan**: Sistem dilarang merugikan kandidat secara sepihak. Misalnya, skill yang belum sempat ditanyakan karena waktu wawancara habis tidak boleh langsung divonis Level 1 (gagal).
2. **Kerahasiaan Data Pribadi**: Percakapan kandidat tidak boleh dicatat sembarangan di log server. Batasan data antar-perusahaan harus dikunci rapat agar perusahaan A tidak bisa mengintip data kandidat perusahaan B.
3. **Kendali Manusia (Human in the loop)**: Penilai manusia harus bisa mengevaluasi dan memperbaiki hasil penilaian AI dengan transparan.

---

## 3. Daftar Masalah & Urutan Keparahan (P0 sampai P3)

Berikut temuan masalah di aplikasi lama yang sudah kita audit dan perbaiki:

| Kode | Tingkat | Masalah & Dampaknya | Jenis Masalah | Letak Berkas |
|---|---|---|---|---|
| **GAP-01** | **P0 (Kritis)** | **Data Nilai Standar di Tabel Fit/Gap Hilang**<br>Backend mengirim nama data `expected_level`, tapi frontend mencari `required_level`. Kolom standar lowongan jadi kosong melompong di layar penilai, dan tanda koreksi manual penilai tidak muncul. | Celah Sambungan Data (Data Seam) | `FitGap::Engine`<br>`ComparisonTable.tsx` |
| **GAP-02** | **P0 (Kritis)** | **Kandidat Langsung Digagalkan Padahal Belum Dites**<br>Generator portofolio memaksa nilai dibatasi antara 1 sampai 5. Skill yang belum sempat dibahas otomatis dijadikan Level 1 (gagal total). Ini sangat merugikan kandidat secara tidak adil. | Logika Rusak & Aturan Belum Ada | `Portfolios::Generator`<br>`db/schema.rb` |
| **GAP-03** | **P0 (Kritis)** | **Data Antar-Perusahaan Bisa Bocor (Multi-Tenant)**<br>Endpoint untuk melihat dan mengubah nilai portofolio tidak menyaring berdasarkan ID perusahaan. Pengguna di Perusahaan A bisa melihat atau mengedit portofolio Perusahaan B jika menebak ID-nya. | Celah Keamanan & UU PDP | `portfolio_skills_controller.rb`<br>`portfolios_controller.rb` |
| **GAP-04** | **P1 (Tinggi)** | **Sistem Crash Saat Jawaban AI Pakai Format Markdown**<br>Jika Gemini membalas dengan format kode ` ```json ... ``` ` atau menyertakan kalimat pengantar, aplikasi langsung error saat mencoba membaca JSON. | Kurang Penangkal Error | `Gemini::HttpClient`<br>`generator.rb` |
| **GAP-05** | **P1 (Tinggi)** | **Link Undangan Wawancara Nyasar**<br>Link undangan sesi wawancara diarahkan ke port backend (3001), bukan ke tampilan web frontend (5173). Kandidat yang mengklik link mendapati halaman kosong/error 404. | Salah Konfigurasi Alamat | `models/session.rb`<br>`application.yml` |
| **GAP-06** | **P2 (Sedang)** | **Percakapan Kandidat Bocor di Log Server**<br>Transkripsi kata-kata kandidat dicetak mentah-mentah ke terminal log server, melanggar privasi data kandidat (UU PDP). | Pelanggaran Privasi | `live_client.rb` |

---

## 4. Strategi Perbaikan & Pilihan Solusi (Trade-Off)

Untuk menyelesaikan masalah di atas, kita mempertimbangkan beberapa opsi:

### Opsi A: Sekadar Perbaikan Cepat di Tampilan (Frontend Quick Fix)
* **Caranya**: Di frontend, kalau nilai kosong langsung dianggap 0 atau disembunyikan.
* **Kelemahan**: Database tetap menyimpan angka 1 (kandidat tetap dicap gagal di backend), data antar-perusahaan tetap bocor, dan celah keamanan tidak tertutup.
* **Keputusan**: **Ditolak.** Ini cuma tambal sulam dan tidak bertanggung jawab.

### Opsi B: Perbaikan Menyeluruh dari Fondasi (Fullstack Monozukuri - Solusi yang Dipilih)
* **Caranya**:
  1. **Di Database**: Bikin migrasi database yang mengizinkan nilai skill bernilai kosong (`NULL`) jika memang belum dites. Jadi statusnya jelas: "Belum Dinilai", bukan "Gagal".
  2. **Di Backend**: Amankan kueri data agar terkunci ke perusahaan masing-masing (return 404 jika ada yang mau mengintip data perusahaan lain), bersihkan output markdown AI secara otomatis, dan sembunyikan rekaman teks suara di log.
  3. **Di Frontend**: Sambungkan nama data yang pas, tampilkan badge `✏ override` kalau penilai melakukan koreksi, beri label "Unassessed" yang jelas, dan buat ringkasan status yang enak dilihat.
* **Hasil**: Sistem aman, adil bagi kandidat, rapi, dan mudah dirawat ke depannya.

---

## 5. Aturan Kerja yang Diterapkan (Kriteria Keberterimaan)

1. **Perlakuan Skill yang Belum Dinilai**:
   - Jika skill belum sempat dibahas dalam wawancara, nilai AI disimpan sebagai kosong (`NULL`).
   - Di tabel perbandingan lowongan, skill ini tidak dihitung sebagai gap/kegagalan, melainkan berstatus **"Unassessed" (Belum Dinilai)** dengan tanda strip `—`.
2. **Koreksi Nilai oleh Penilai (Human Override)**:
   - Jika penilai mengoreksi nilai AI (misal dari L2 ke L3), tabel langsung menampilkan nilai baru, menghitung ulang selisihnya, dan menampilkan tanda `✏ override`.
3. **Resiliensi AI Gemini**:
   - Jika AI mengembalikan teks dengan format markdown atau kalimat pembuka, pembersih teks otomatis mengekstrak bagian JSON-nya saja sehingga aplikasi tidak akan crash.
4. **Keamanan Data Perusahaan**:
   - Upaya mengakses data portofolio atau mengubah nilai milik perusahaan lain langsung ditolak dengan status HTTP 404 (Not Found).
5. **Link Undangan Kandidat**:
   - Link yang dikirim ke kandidat mengarah langsung ke alamat web antarmuka wawancara (`http://localhost:5173/interview/:token`).

---

## 6. Bukti Pengujian & Kualitas Kode

Untuk memastikan semua perbaikan berjalan sempurna tanpa merusak fitur lain:

### 6.1 Hasil Pengujian Otomatis (Test Suite)
* **Frontend (Vitest)**: Dibuat pengujian untuk komponen tabel perbandingan dan kartu portofolio.
  ```text
  Test Files  2 passed (2)
  Tests       7 passed (7)
  Duration    1.80 detik
  Status      100% HIJAU (Lolos Semua)
  ```
* **Frontend Production Build**:
  ```text
  ✓ 1842 modules transformed.
  ✓ built in 3.3 detik (0 error / bersih)
  ```

### 6.2 Bukti Tes Sengaja Dirusak (Seeded Fault Test)
Untuk membuktikan bahwa tes otomatis kita benar-benar bekerja dan bukan tes pajangan:
1. Kita sengaja merusak kode di `ComparisonTable.tsx` (mengembalikan bug lama di mana nilai standar lowongan tidak dibaca).
2. Kita jalankan tes otomatis: **Sistem tes langsung menjerit merah dan menangkap error tersebut dengan tepat** (`AssertionError: expected element with text "L3" to be in the document`).
3. Setelah kode yang benar dikembalikan, tes langsung kembali hijau 100%. Ini membuktikan tes kita ampuh mencegah bug kambuh di masa depan.

### 6.3 Momen Verifikasi Saran AI (AI Verification Moment)
Saat proses pembuatan kode, AI sempat menyarankan agar skill yang belum dites diberi nilai default `0` di Ruby.
* **Bahayanya**: Database PostgreSQL memiliki aturan ketat `CHECK (ai_level BETWEEN 1 AND 5)`. Kalau kita isi `0`, database langsung meledak dengan pesan error `PG::CheckViolation`, membuat proses penyimpanan data gagal total.
* **Tindakan Kita**: Kita langsung mengecek skema database asli, menolak saran nilai 0 tersebut, dan membuat file migrasi database resmi yang mengizinkan nilai `NULL` secara aman dan bisa dibatalkan jika diperlukan (*reversible migration*).

---

## 7. Desain & Tampilan Antarmuka Baru (UI/UX)

Tampilan antarmuka telah ditingkatkan dengan standar kerapian tinggi:
1. **Tabel Perbandingan Fit/Gap**:
   - Kolom *Skill*, *Required* (Standar Lowongan), *Candidate* (Nilai Kandidat), dan *Result* (Hasil).
   - Indikator hasil yang jelas: Cocok (✅), Melebihi (⭐), Kurang (⚠️), dan Belum Dinilai (⚪).
   - Kotak ringkasan di bawah tabel yang menghitung otomatis jumlah skill yang cocok, kurang, dan belum dinilai.
2. **Kartu Portofolio Skill**:
   - Menampilkan alasan AI kenapa suatu nilai diberikan.
   - Skill yang belum dites menampilkan kotak informasi ramah: *"Skill ini belum sempat dibahas mendalam pada wawancara. Tidak ada nilai yang diberikan agar tidak merugikan kandidat."*
   - Kutipan percakapan kandidat kini memiliki tombol buka-tutup (*View all* / *Collapse*) sehingga halaman tidak kepanjangan dan nyaman dibaca di layar HP maupun laptop.

---

## 8. Panduan & Skrip Rekaman Video (3 sampai 5 Menit)

Berikut panduan santai apa saja yang perlu Anda buka di layar dan bicarakan saat merekam video penjelasan untuk diserahkan ke kantor:

### Persiapan Rekaman:
* Gunakan aplikasi perekam layar seperti **Loom**, **OBS**, atau rekam rapat mandiri di **Google Meet**.
* Pastikan suara mikrofon jelas dan buka 3 jendela di laptop:
  1. Halaman web aplikasi di browser.
  2. Editor kode (VS Code).
  3. Terminal pengujian.

---

### Alur Pembicaraan Detik demi Detik:

#### [Menit 0:00 - 0:45] Pembuka & Masalah Utama yang Ditemukan
* **Tampilan Layar**: Buka halaman web aplikasi atau slide judul.
* **Yang Diucapkan**:
  > *"Halo tim penilai Rakamin. Di video ini saya ingin mempresentasikan hasil perbaikan untuk platform wawancara AI ini.*
  > *Setelah saya telusuri dari awal sampai akhir, saya menemukan dua masalah paling kritis:*
  > *Pertama, tabel perbandingan lowongan nilai standarnya hilang kosong karena nama datanya tidak nyambung antara backend dan frontend.*
  > *Kedua dan yang paling fatal, kandidat yang skill-nya belum sempat ditanyakan karena waktu habis, otomatis dikasih nilai 1 alias langsung dicap gagal. Ini sangat merugikan kandidat dan melanggar prinsip keadilan pemrosesan data (UU PDP)."*

#### [Menit 0:45 - 1:45] Perbaikan di Sisi Backend & Database
* **Tampilan Layar**: Buka VS Code (`FitGap::Engine`, berkas migrasi database, dan pembersih JSON).
* **Yang Diucapkan**:
  > *"Untuk mengatasi hal ini, saya memperkuat fondasi di backend:*
  > *1. Saya membuat migrasi database yang aman agar nilai skill boleh bernilai kosong (NULL) jika belum diuji, jadi kandidat tidak langsung dicap gagal.*
  > *2. Akses data antar-perusahaan dikunci rapat. Kalau ada yang mencoba mengintip data kandidat perusahaan lain, sistem langsung menolak dengan error 404.*
  > *3. Komunikasi dengan AI Gemini diperkuat dengan pembersih format markdown agar sistem tidak crash saat menerima jawaban AI.*
  > *4. Dan untuk mematuhi privasi UU PDP, teks percakapan kandidat disembunyikan dari catatan log server."*

#### [Menit 1:45 - 2:45] Tampilan Baru di Sisi Frontend
* **Tampilan Layar**: Buka browser dan tunjukkan halaman tabel Fit/Gap dan Kartu Portofolio.
* **Yang Diucapkan**:
  > *"Di sisi tampilan web, pengalamannya sekarang jauh lebih jelas dan nyaman:*
  > *Tabel perbandingan lowongan sekarang menampilkan nilai yang lengkap dengan badge level L1 sampai L5.*
  > *Kalau penilai mengoreksi nilai AI, muncul tanda pensil override yang elegan.*
  > *Skill yang belum dites diberi label khusus 'Unassessed', bukan dianggap gagal.*
  > *Dan di kartu portofolio, kutipan percakapan kandidat bisa dibuka-tutup dengan tombol expand/collapse agar penilai bisa membaca bukti penilaian dengan cepat."*

#### [Menit 2:45 - 3:30] Bukti Kualitas Kode & Pengujian
* **Tampilan Layar**: Buka terminal dan jalankan `npm test`.
* **Yang Diucapkan**:
  > *"Untuk memastikan semuanya berjalan stabil, saya membuat rangkaian tes otomatis di frontend menggunakan Vitest. Semua 7 skenario pengujian lolos 100% dalam waktu kurang dari 2 detik.*
  > *Saya juga membuktikan kekuatan tes ini dengan metode Seeded Fault: saya sengaja merusak salah satu logika tabel, dan tes otomatis langsung mendeteksi error tersebut secara akurat.*
  > *Selain itu, saat AI menyarankan nilai default 0 yang berisiko merusak database Postgres, saya langsung mencegahnya dan membuat solusi migrasi database yang benar."*

#### [Menit 3:30 - 4:00] Penutup & Rangkuman
* **Tampilan Layar**: Tunjukkan folder berkas laporan atau halaman Pull Request GitHub.
* **Yang Diucapkan**:
  > *"Semua perubahan sudah tersimpan rapi di branch Git dengan alur CI otomatis dan didokumentasikan lengkap dalam berkas PDF laporan ini.*
  > *Dengan pembaruan ini, platform wawancara AI ini siap digunakan secara aman, adil bagi kandidat, dan memberikan hasil yang bisa dipercaya oleh perusahaan. Terima kasih!"*

---
*Laporan disusun dengan standar ketelitian Monozukuri untuk evaluasi studi kasus Rakamin AI Interview Platform.*
