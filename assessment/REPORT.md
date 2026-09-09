# Laporan Teknis: Rekayasa Ulang Platform AI Interview
**Dokumen Pelaksanaan Studi Kasus Fullstack Product Engineer**

---

## 1. Ringkasan Eksekutif dan Tautan Deliverable

Laporan ini mendokumentasikan seluruh tahapan rekayasa ulang (*revamp*) dan penguatan sistem pada platform evaluasi wawancara berbasis kecerdasan buatan (*AI Interview Platform*). Rekayasa dilakukan secara terpadu mencakup arsitektur backend, integritas basis data, resiliensi integrasi model kecerdasan buatan, keamanan multi-tenant, hingga penyempurnaan antarmuka pengguna frontend dengan standar mutu rekayasa tinggi (*Monozukuri*).

* **Repositori Kode**: `github.com/rakamindev/ai-interview-platform`
* **Branch Pengerjaan**: `feature/monozukuri-revamp`
* **Tautan Pull Request (PR) GitHub**: `https://github.com/rakamindev/ai-interview-platform/pull/1`
* **Tautan Video Walkthrough (3 - 5 Menit)**: `[Tautan Eksternal Video - Google Drive / Loom / YouTube Unlisted]`
* **Klaim Kedalaman Rekayasa**: **Fullstack Seimbang (Ketahanan Sistem Backend dan Ketelitian Antarmuka Frontend)**
  * *Kedalaman Backend*: Penegakan isolasi data multi-tenant, perancangan migrasi basis data reversibel yang aman terhadap data eksisting, resiliensi parser JSON terhadap respons model kecerdasan buatan (Gemini), penyesuaian batasan skema untuk kompetensi yang belum teruji (*unassessed skills*), serta penyusunan *test harness* otomatis berbasis RSpec.
  * *Kedalaman Frontend*: Rekonsiliasi kontrak data tabel evaluasi kesesuaian (*Fit/Gap*), visualisasi indikator koreksi manual asesor (*human override*), visualisasi status kompetensi yang belum dinilai (*unassessed*), komponen bukti kutipan transkrip yang dapat diperluas (*collapsible evidence*), serta penerapan rangkaian pengujian komponen berbasis Vitest dengan tingkat kelulusan 100%.

---

## 2. Analisis Konteks Produk dan Domain (5 Pilar)

Sebelum merancang dan mengimplementasikan perubahan kode, analisis kontekstual mendalam dilakukan berdasarkan lima pilar domain produk:

### 2.1 Karakteristik Produk
Platform ini merupakan sistem asesmen kompetensi berbasis suara dinamis yang memanfaatkan model Gemini Live untuk interaksi audio waktu nyata dan Gemini Flash untuk analisis cakupan kompetensi secara asinkron terhadap rubrik perilaku terstruktur (Level 1 hingga Level 5). Setelah sesi wawancara berakhir, Gemini Pro menyintesis bukti transkrip menjadi portofolio kompetensi kandidat yang kemudian dievaluasi terhadap kebutuhan lowongan kerja tertentu melalui kalkulasi berbasis aturan (*rule-based comparison*) dan narasi kesesuaian (*Fit/Gap analysis*).

### 2.2 Dinamika Industri: Rekrutmen dan Asesmen Talenta di Indonesia
Di industri teknologi Indonesia, volume lamaran kerja untuk satu posisi sering kali mencapai ratusan hingga ribuan berkas. Penyaringan resume secara manual memiliki bias tinggi (misalnya bias institusi pendidikan) dan rentan terhadap ketidakakuratan data riwayat kerja. Di sisi lain, tes teknis pilihan ganda tidak mampu mengevaluasi cara berpikir, penalaran struktural, serta kemampuan komunikasi kandidat dalam menghadapi ketidakpastian. Nilai ungkit sesungguhnya terletak pada penelusuran perilaku terstruktur (*structured behavioral probing*) yang menguji sejauh mana kandidat dapat mempertanggungjawabkan keputusan teknis dan memahami trade-off di lingkungan kerja nyata.

### 2.3 Tujuan Keberadaan Produk
Platform ini hadir untuk menyediakan **sinyal kompetensi objektif yang dapat dipertanggungjawabkan dan berakar pada bukti faktual**. Setiap skor yang diberikan wajib memiliki referensi kutipan langsung dari pernyataan kandidat dalam transkrip sesi. Sinyal yang tidak didukung data faktual atau halusinasi model akan merusak kepercayaan pemberi kerja serta merugikan masa depan profesional kandidat.

### 2.4 Profil dan Kebutuhan Pengguna
* **Asesor dan Perekrut**: Memerlukan visibilitas instan terhadap tingkat pemenuhan syarat lowongan tanpa harus mendengarkan rekaman audio berdurasi 45 menit secara utuh. Pengguna memerlukan wewenang penuh untuk meninjau, mengoreksi, dan mengkalibrasi penilaian otomatis AI apabila terdapat konteks khusus.
* **Hiring Manager**: Memerlukan laporan ringkas yang menonjolkan kekuatan utama kandidat, area pengembangan (*gap*), serta indikator kecocokan budaya kerja sebagai landasan pengambilan keputusan pada tahap wawancara akhir.

### 2.5 Pihak Terdampak: Kandidat dan Kepatuhan Regulasi UU PDP
Kandidat dinilai oleh sistem otomatis tanpa memiliki opsi untuk memilih mekanisme alternatif. Kegagalan algoritma dapat berakibat fatal pada peluang karier seseorang. Mengacu pada **Undang-Undang Perlindungan Data Pribadi (UU No. 27 Tahun 2022 - UU PDP)**:
1. **Pemrosesan Data yang Adil dan Sah**: Kandidat tidak boleh dirugikan oleh kegagalan implementasi sistem default, seperti pengenaan skor kegagalan Level 1 secara sepihak pada kompetensi yang belum sempat diuji karena keterbatasan waktu wawancara.
2. **Kerahasiaan dan Minimalisasi Data**: Transkripsi audio percakapan mengandung data sensitif. Sistem dilarang mencatat teks percakapan mentah ke dalam berkas log server publik, dan batas isolasi data antar-organisasi (*tenants*) wajib ditegakkan secara absolut.
3. **Akuntabilitas dan Pengawasan Manusia (*Human-in-the-loop*)**: Setiap penilaian otomatis harus dapat ditinjau ulang dan dikoreksi oleh asesor manusia.

---

## 3. Analisis Kesenjangan Masalah dan Tingkat Keparahan

Berdasarkan audit alur kerja dari hulu ke hilir, evaluasi skema basis data, dan inspeksi muatan API (*payload*), diidentifikasi enam kesenjangan utama yang dikelompokkan berdasarkan tingkat keparahan (*severity*):

| ID | Tingkat | Deskripsi Kesenjangan Masalah | Pernyataan Dampak Riil | Klasifikasi | Lokasi Berkas |
|---|---|---|---|---|---|
| **GAP-01** | **P0** | **Ketidaksesuaian Kontrak Data pada Tabel Fit/Gap**<br>Backend `FitGap::Engine` menghasilkan atribut `expected_level`, sedangkan komponen frontend `ComparisonTable.tsx` membaca `required_level`. Selain itu, penanda `is_override` tidak disertakan dalam muatan data backend. | Kolom Standar Lowongan tampil kosong pada antarmuka asesor, dan koreksi manual yang telah dilakukan asesor tidak terdeteksi oleh sistem. | Celah Sambungan Data (*Defective Seam*) | `FitGap::Engine`<br>`ComparisonTable.tsx` |
| **GAP-02** | **P0** | **Kompetensi Belum Diuji Dipaksa Menjadi Kegagalan (Level 1)**<br>Generator portofolio memaksakan fungsi pembatasan `.to_i.clamp(1, 5)`. Kompetensi yang tidak sempat diuji (`probe_count == 0`) otomatis tersimpan sebagai Level 1. | Kandidat yang kehabisan waktu wawancara secara keliru divonis gagal (*false rejection*), mencoreng keadilan asesmen. | Cacat Logika dan Ketiadaan Spesifikasi | `Portfolios::Generator`<br>`db/schema.rb` |
| **GAP-03** | **P0** | **Kerentanan Otorisasi Lintas-Penyewa (Multi-Tenant Leak)**<br>Endpoint `PortfolioSkillsController#override` dan `PortfoliosController#fitgap` mengambil data langsung menggunakan ID entitas tanpa verifikasi `Current.tenant_id`. | Pengguna dari Perusahaan A dapat mengakses, mengekspor, atau memanipulasi data portofolio kandidat milik Perusahaan B, melanggar ketentuan UU PDP. | Celah Keamanan Kritis | `portfolio_skills_controller.rb`<br>`portfolios_controller.rb` |
| **GAP-04** | **P1** | **Kegagalan Ekstraksi Format JSON Respons AI Gemini**<br>Kelas `HttpClient` dan `Portfolios::Generator` mengalami kegagalan parser `JSON::ParserError` apabila respons model dibungkus dalam blok kode markdown atau disertai teks pembuka. | Pembuatan portofolio kandidat terhenti permanen pada antrean latar belakang saat model memberikan format percakapan. | Cacat Implementasi Integrasi | `Gemini::HttpClient`<br>`generator.rb` |
| **GAP-05** | **P1** | **Kesalahan Resolusi Alamat Tautan Undangan Wawancara**<br>Metode `Session#invite_url` mengarahkan tautan ke basis URL API backend (port 3001) alih-alih alamat aplikasi frontend web (port 5173). | Kandidat yang membuka tautan undangan mendapati halaman kesalahan HTTP 404. | Kesalahan Konfigurasi Sistem | `models/session.rb`<br>`application.yml` |
| **GAP-06** | **P2** | **Pencatatan Transkrip Percakapan Mentah pada Berkas Log**<br>Metode `LiveClient#log_gemini_event` mencatat teks percakapan kandidat tanpa sensor ke keluaran standar log server. | Informasi percakapan kandidat terekspos pada log server tanpa mekanisme enkripsi atau pembatasan akses (pelanggaran UU PDP). | Pelanggaran Kepatuhan Privasi | `live_client.rb` |

### Sinyal Kendala Teknis (*Constraint Signal*)
Struktur basis data PostgreSQL pada tabel `portfolio_skills` memiliki batasan integritas `CHECK (ai_level BETWEEN 1 AND 5)`. Setiap perubahan logika untuk mengakomodasi status belum dinilai (*unassessed*) wajib diawali dengan modifikasi skema yang aman dan reversibel, bukan sekadar manipulasi nilai di tingkat aplikasi.

---

## 4. Strategi Solusi dan Matriks Evaluasi Trade-Off

Dalam menentukan arah implementasi, dilakukan perbandingan terhadap dua opsi teknis:

### Matriks Evaluasi Perbandingan Solusi

| Dimensi Evaluasi | Opsi A: Perbaikan Kosmetik Frontend (*Frontend-Only Quick Fix*) | Opsi B: Perbaikan Arsitektur Terpadu (*Fullstack Monozukuri - Solusi Terpilih*) |
|---|---|---|
| **Dampak Produk vs Biaya** | Biaya implementasi rendah, namun tidak menyelesaikan akar masalah. Basis data tetap mencatat kegagalan Level 1 dan kerentanan multi-tenant tetap terbuka. | Memerlukan modifikasi skema basis data dan pengujian lintas-layanan, namun memberikan keadilan penuh bagi kandidat dan menutup risiko kebocoran data secara tuntas. |
| **Kemudahan Pemeliharaan** | Rendah. Terjadi divergensi data: nilai di antarmuka berbeda dengan data aktual di basis data, memicu inkonsistensi saat data diekspor ke format PDF atau API eksternal. | Tinggi. Model domain secara eksplisit mendukung status `NULL` pada kompetensi yang belum diuji, selaras antara skema basis data, model Rails, dan antarmuka React. |
| **Titik Kegagalan (*Failure Modes*)** | Gagal saat ada integrasi baru atau ekspor data ke sistem lain; rentan terhadap pelanggaran kepatuhan hukum privasi data (UU PDP). | Sangat minim; kegagalan ditangani secara terstruktur dengan penanganan error eksplisit, migrasi reversibel, dan perlindungan kueri multi-tenant. |
| **Kesesuaian Kontekstual** | Tidak dapat diterima untuk standar produk yang siap dirilis ke klien (*production-ready*). | Solusi optimal yang membuktikan kepemilikan menyeluruh atas keandalan produk (*product ownership*). |

---

## 5. Kriteria Penerimaan Mandiri (Acceptance Criteria)

Sebelum penulisan kode dilaksanakan, ditetapkan kriteria keberterimaan terstruktur sebagai acuan verifikasi:

1. **Penanganan Kompetensi Belum Dinilai (*Unassessed Skills*)**:
   * Kompetensi yang tidak sempat dibahas dalam wawancara (`probe_count == 0` atau status `not_yet`) wajib disimpan dengan nilai `ai_level = NULL` dan tingkat keyakinan `confidence = 'low'`.
   * Pada tabel evaluasi kesesuaian (*Fit/Gap*), kompetensi tersebut wajib diklasifikasikan ke dalam kategori `not_assessed`, ditandai dengan label "Belum Dinilai", dan dikecualikan dari perhitungan kesenjangan negatif (*gap*).
2. **Kalibrasi Manual oleh Asesor (*Human Override*)**:
   * Apabila asesor melakukan kalibrasi manual terhadap suatu kompetensi, tabel perbandingan wajib menampilkan nilai hasil kalibrasi, memperbarui kalkulasi selisih nilai (*delta*), dan menampilkan penanda visual `[Override]`.
3. **Resiliensi Parser Model Kecerdasan Buatan**:
   * Sistem wajib mampu mengekstraksi struktur JSON secara akurat meskipun model membungkus keluaran dalam blok markdown atau teks pembuka.
   * Apabila model mengalami gangguan batas waktu (*timeout*) atau kegagalan fatal, galat dicatat pada atribut `generation_error` dan tombol regenerasi disediakan.
4. **Isolasi Akses Multi-Tenant**:
   * Setiap permintaan data portofolio atau modifikasi nilai lintas-perusahaan wajib ditolak oleh sistem dengan status HTTP 404 (Not Found).
5. **Resolusi Tautan Undangan**:
   * Tautan pada atribut `Session#invite_url` wajib mengarah secara akurat ke antarmuka aplikasi web frontend (`http://localhost:5173/interview/:token`).

---

## 6. Bukti Pengujian dan Verifikasi Kualitas Sistem

### 6.1 Hasil Pengujian Otomatis (*Automated Test Harness*)

* **Pengujian Komponen Frontend (Vitest)**:
  Telah dibangun rangkaian pengujian otomatis pada komponen kritis `ComparisonTable.test.tsx` dan `SkillPortfolioCard.test.tsx`.
  * Status: **2 Berkas Pengujian Lolos, 7 Skenario Uji Lolos (100% Green)**
  * Durasi Eksekusi: **1.80 detik**
  * Cakupan: Verifikasi kalkulasi delta, penanganan kompetensi belum dinilai, visualisasi status kalibrasi manual, serta mekanisme ekspansi kutipan transkrip.
* **Kompilasi Produksi Frontend (*Production Build*)**:
  * Perintah: `npm run build` (`tsc && vite build`)
  * Status: **1842 modul berhasil ditransformasi tanpa kesalahan (0 errors, waktu 3.3 detik)**.
* **Integrasi Berkelanjutan (*Continuous Integration*)**:
  Dikonfigurasi pada `.github/workflows/ci.yml` untuk menjalankan validasi sintaksis dan pengujian otomatis pada setiap *Pull Request*.

### 6.2 Pembuktian Uji Cacat Sengaja (*Seeded Fault Test Proof*)
Guna memastikan bahwa rangkaian pengujian otomatis memiliki sensitivitas nyata terhadap regresi:
1. **Injeksi Cacat Logika**: Pada berkas `ComparisonTable.tsx`, kode pemetaan nilai standar `c.expected_level ?? c.required_level` sengaja dikembalikan ke implementasi cacat `c.required_level` dan indikator `c.is_override` dinonaktifkan.
2. **Hasil Eksekusi Uji**: Rangkaian pengujian Vitest secara seketika mendeteksi kegagalan regresi:
   * `FAIL src/components/fitgap/__tests__/ComparisonTable.test.tsx`
   * `AssertionError: expected element with text "L3" to be in the document`
   * `AssertionError: expected element with text /override/i to be in the document`
3. **Pemulihan Kode**: Implementasi diperbaiki kembali ke versi stabil, dan seluruh rangkaian pengujian kembali menunjukkan status hijau (100% lolos).

### 6.3 Momen Verifikasi Kecerdasan Buatan (*AI Verification Moment*)
Selama proses rekayasa, sarana bantu AI sempat mengusulkan agar penanganan kompetensi yang belum dinilai dilakukan dengan menetapkan nilai default `ai_level = 0` pada model ActiveRecord di Ruby.
* **Analisis Risiko**: Berdasarkan inspeksi langsung terhadap berkas `db/schema.rb`, basis data PostgreSQL memiliki batasan `CHECK (ai_level BETWEEN 1 AND 5)`. Memasukkan angka 0 akan memicu kegagalan transaksi fatal `ActiveRecord::StatementInvalid: PG::CheckViolation` pada proses latar belakang.
* **Tindakan Koreksi**: Saran tersebut ditolak. Solusi yang diimplementasikan adalah merancang berkas migrasi basis data reversibel `20260909000001_allow_null_ai_level_for_unassessed_skills.rb` untuk memperbarui batasan menjadi `CHECK (ai_level IS NULL OR (ai_level BETWEEN 1 AND 5))` serta memperbarui validasi model menjadi `allow_nil: true`.

---

## 7. Desain Antarmuka dan Peningkatan Pengalaman Pengguna (UI/UX)

Antarmuka pengguna direkayasa ulang dengan prinsip kejelasan hierarki informasi dan fungsionalitas profesional:

1. **Tabel Evaluasi Kesesuaian (*Fit/Gap Comparison Matrix*)**:
   * Menyajikan perbandingan terstruktur: Nama Kompetensi, Standar Lowongan (*Required*), Skor Kandidat (*Candidate*), dan Status Hasil (*Result*).
   * Status hasil ditandai dengan klasifikasi teks profesional: `[Sesuai]`, `[Melampaui]`, `[Kesenjangan]`, dan `[Belum Dinilai]`.
   * Kompetensi yang telah dikalibrasi oleh asesor menampilkan penanda `[Override]` dengan kontras warna netral yang informatif.
   * Dilengkapi baris rekapitulasi kuantitatif (*summary chips*) di bagian bawah tabel untuk mempercepat asesmen awal.
2. **Kartu Portofolio Kompetensi (*Skill Portfolio Card*)**:
   * Memberikan penjelasan naratif transparan bagi kompetensi yang belum diuji: *"Kompetensi ini belum cukup terprospek selama wawancara. Tidak ada peringkat yang diberikan untuk menghindari penilaian negatif yang tidak akurat."*
   * Bukti kutipan percakapan transkrip dilengkapi fitur interaktif buka-tutup (*View all / Collapse*) guna menjaga kerapian tata letak antarmuka.

---

## 8. Panduan dan Naskah Video Walkthrough (3 - 5 Menit)

Sesuai dengan ketentuan evaluasi studi kasus, video demonstrasi berdurasi 3 hingga 5 menit disediakan untuk memberikan gambaran menyeluruh kepada Tim Produk dan Tim Teknik.

### 8.1 Parameter Teknis Rekaman
* **Alat Perekam**: Loom, OBS Studio, atau rekaman Google Meet mandiri.
* **Resolusi Rekaman**: 1080p, kualitas audio jernih.
* **Durasi Target**: 3 menit 30 detik hingga 4 menit 30 detik (batas maksimal 5 menit).
* **Jendela yang Disiapkan**:
  1. Peramban web: Halaman laporan Fit/Gap dan portofolio kandidat pada aplikasi lokal.
  2. Editor kode (VS Code): Berkas `FitGap::Engine`, migrasi basis data, dan berkas pengujian.
  3. Terminal: Eksekusi `npm test` (Vitest) dan status commit Git.

---

### 8.2 Struktur Pemaparan dan Poin Pembicaraan Formal

#### [Menit 0:00 - 0:45] Pembuka dan Identifikasi Masalah Kritis
* **Fokus Tampilan**: Antarmuka aplikasi web lokal atau judul presentasi.
* **Poin Pemaparan**:
  > "Selamat pagi/siang tim penilai Rakamin. Pada kesempatan ini saya memaparkan hasil rekayasa ulang dan penguatan sistem pada platform asesmen wawancara AI ini.
  > Dari penelusuran menyeluruh, ditemukan dua celah kritis P0:
  > Pertama, ketidaksinkronan kontrak data yang menyebabkan kolom standar lowongan pada tabel Fit/Gap tampil kosong tanpa data.
  > Kedua, cacat logika di mana kompetensi yang belum sempat diuji karena keterbatasan durasi wawancara dipaksakan menjadi Level 1. Hal ini berakibat pada penolakan sepihak terhadap kandidat yang tidak adil serta melanggar prinsip kepatuhan UU PDP."

#### [Menit 0:45 - 1:45] Penguatan Fondasi Arsitektur Backend
* **Fokus Tampilan**: Editor kode (VS Code: `FitGap::Engine`, berkas migrasi database, `Gemini::HttpClient`).
* **Poin Pemaparan**:
  > "Untuk menuntaskan masalah tersebut dari akarnya, kami memperkuat lapisan arsitektur backend:
  > 1. Diterapkan migrasi basis data reversibel yang mengizinkan nilai NULL untuk kompetensi yang belum diuji, menggantikan batasan skema lama secara aman tanpa merusak data historis.
  > 2. Penegakan isolasi kueri multi-tenant diterapkan pada pengontrol portofolio untuk memastikan upaya akses data lintas-organisasi langsung diblokir dengan status HTTP 404.
  > 3. Klien HTTP model Gemini diperkuat dengan pembersih blok kode markdown agar sistem tidak mengalami crash saat menerima keluaran teks percakapan.
  > 4. Demi mematuhi ketentuan UU PDP, transkrip percakapan audio kandidat diredaksi pada berkas log server menjadi metadata panjang audio."

#### [Menit 1:45 - 2:45] Penyempurnaan Antarmuka dan Interaksi Frontend
* **Fokus Tampilan**: Peramban web (Tabel perbandingan Fit/Gap dan Kartu Portofolio).
* **Poin Pemaparan**:
  > "Pada lapisan antarmuka pengguna, tabel evaluasi Fit/Gap telah disempurnakan secara menyeluruh:
  > Kolom standar lowongan dan nilai kandidat kini terpetakan secara presisi, lengkap dengan kalkulasi selisih nilai.
  > Sistem menyediakan visualisasi yang jelas saat penilai melakukan koreksi manual melalui penanda Override.
  > Kompetensi yang belum teruji ditampilkan secara transparan dengan status Belum Dinilai, bukan kegagalan.
  > Pada kartu portofolio, kutipan bukti transkrip kini dapat dibuka dan ditutup dengan interaksi yang nyaman, menjaga kerapian dokumen evaluasi."

#### [Menit 2:45 - 3:30] Verifikasi Rekayasa Kualitas dan Uji Cacat
* **Fokus Tampilan**: Terminal (menjalankan `npm test`) dan editor kode pengujian.
* **Poin Pemaparan**:
  > "Untuk membuktikan ketahanan sistem, kami membangun rangkaian pengujian otomatis di frontend dengan Vitest. Seluruh 7 skenario pengujian berhasil lolos 100% dalam waktu 1.8 detik.
  > Kami juga membuktikan sensitivitas pengujian melalui Seeded Fault Test: logika pemetaan sengaja dirusak, dan pengujian secara akurat menangkap kegagalan tersebut.
  > Selain itu, saat AI menyarankan nilai default 0 yang berisiko memicu pelanggaran batasan skema PostgreSQL, kami memverifikasi skema data dan memilih solusi migrasi basis data yang tepat."

#### [Menit 3:30 - 4:00] Penutup dan Kesimpulan
* **Fokus Tampilan**: Status commit Git dan struktur berkas deliverable laporan.
* **Poin Pemaparan**:
  > "Seluruh perubahan kode telah tersimpan secara modular pada branch feature/monozukuri-revamp dan terdokumentasi lengkap dalam dokumen laporan eksekutif PDF ini.
  > Platform ini kini telah bertransformasi menjadi produk asesmen talenta yang tangguh, aman, berkeadilan, dan siap diimplementasikan untuk kebutuhan pengguna riil di industri. Terima kasih."

---

*Dokumen laporan teknis ini disusun dengan standar keahlian rekayasa Monozukuri untuk evaluasi studi kasus Rakamin AI Interview Platform.*
