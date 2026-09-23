# KPR Refinance Calculator 🏦

Aplikasi web modern, interaktif, dan komprehensif untuk simulasi dan analisis kelayakan **Refinancing KPR (Kredit Pemilikan Rumah)** di Indonesia. Membantu debitur membandingkan KPR bank saat ini dengan penawaran KPR take-over / refinance bank baru secara mendalam.

**Live demo:** [gems-fn123.github.io/kpr-refinance-model](https://gems-fn123.github.io/kpr-refinance-model/)

---

## ✨ Fitur Utama

- 🤖 **AI Tenor & Mortgage Advisor (Didukung Google Gemini - Kuota Gratis)**:
  - Chatbot konsultan finansial interaktif yang menganalisis simulasi KPR saat itu juga secara real-time.
  - Memberikan rekomendasi **tenor paling optimal** (pilihan *Sweet Spot* / Seimbang, Paling Hemat Bunga Total, dan Paling Ringan Cicilan).
  - Tombol **1-klik terapkan tenor** langsung ke kalkulator tanpa perlu mengetik ulang.
  - Menggunakan API Google Gemini (model `gemini-2.5-flash` / `gemini-1.5-flash`) dengan kuota **100% gratis** dari Google AI Studio tanpa perlu kartu kredit, plus mesin optimasi offline otomatis jika belum memasukkan API key.
- 🏦 **Preset Bank & Skema Promo Riil**:
  - Pilihan preset 1-klik untuk promo bank-bank Indonesia: **Mandiri, BTN, BRI, BCA, CIMB Niaga, BNI, BSI Syariah, dan OCBC**.
  - Otomatis mengisi struktur suku bunga berjenjang/fixed, tenor tahapan, tenor rekomendasi, estimasi provisi, dan biaya administrasi.
- 📊 **Perbandingan Skema Bunga Lengkap**:
  - **Fixed Bertahap (Step)**: Bunga berjenjang bertahap (contoh: Tahun 1-3 fixed 5.5%, Tahun 4-6 fixed 7.5%, sisa tenor floating 10.5%).
  - **Fixed lalu Floating**: Periode fixed awal kemudian floating hingga akhir masa pinjaman.
  - **Fixed Sampai Akhir (Full Fixed)**: Bunga tetap sepanjang tenor.
- 💰 **Analisis Finansial Komprehensif**:
  - **NPV (Net Present Value)**: Penghematan memperhitungkan nilai waktu uang (*time value of money*) dengan discount rate yang dapat disesuaikan.
  - **Break-Even Point (BEP)**: Menghitung persis di bulan ke berapa penghematan cicilan menutup seluruh biaya penalti dan proses refinancing.
  - **Validasi LTV (Loan-to-Value)**: Peringatan otomatis jika total pinjaman baru melampaui batas rasio LTV atas taksiran nilai properti.
  - **Simulasi Biaya Lengkap**: Biaya provisi, administrasi, appraisal, asuransi jiwa & kebakaran, notaris/legal, hingga penalti pelunasan dipercepat (*early repayment penalty*).
- 📈 **Visualisasi Interaktif**:
  - **Grafik Sisa Pokok Pinjaman**: Penurunan saldo pokok pinjaman (*amortization curve*) antara bank lama vs bank baru dari tahun ke tahun.
  - **Grafik Akumulasi Penghematan**: Progres akumulasi kas penghematan bulanan menuju titik break-even.
  - **Analisis Sensitivitas Suku Bunga**: Simulasi bagaimana jika suku bunga floating pasar bergerak naik/turun ±2% terhadap kelayakan refinancing.
- 📋 **Tabel Amortisasi Lengkap & Export CSV**:
  - Jadwal angsuran per bulan: alokasi pokok, bunga, sisa saldo, dan suku bunga aktif.
  - Paginasi 12 bulan (tahunan) yang bersih.
  - Tombol **Export CSV** untuk analisis spreadsheet lebih lanjut (Excel / Google Sheets).
- 🎨 **UI Modern & Pengalaman Pengguna**:
  - **Dark Mode & Light Mode**: Sinkron otomatis dengan tema sistem dan tersimpan di `localStorage`.
  - **Print & PDF Ready**: Dilengkapi CSS `@media print` sehingga dapat langsung dicetak (Ctrl+P / Simpan sebagai PDF) dengan tampilan laporan bersih tanpa tombol form.
  - **Bagikan Hasil**: Tombol bagikan via Web Share API atau salin ringkasan ke clipboard.
  - **Responsif Sepenuhnya**: Nyaman digunakan di ponsel pintar maupun desktop layar lebar.

---

## 📊 Riset Pasar Skema KPR Indonesia (CIMB, BTN, Mandiri, BRI, BCA, dll.)

Untuk memastikan kalkulasi refinancing mencerminkan kondisi riil industri perbankan nasional, kami menyusun riset pasar mendalam mengenai suku bunga, tahapan bunga, tenor, biaya, dan penalti pelunasan.

> 📘 **Dokumentasi Lengkap:** Silakan baca laporan komprehensif di [`docs/market_research_kpr_indonesia.md`](docs/market_research_kpr_indonesia.md)

### Ringkasan Parameter Kunci Antar-Bank:

| Bank | Skema Unggulan | Tahapan Suku Bunga | Durasi Tahapan | Min. Tenor | Maks. Tenor | Penalti (Fixed / Floating) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CIMB Niaga** | **KPR Xtra Berjenjang** & Offset Bebas Bunga | Th 1: `3.90% - 4.15%`<br>Th 2-3: `6.25% - 6.99%`<br>Th 4-6: `8.25% - 8.99%`<br>Th 7-10: `9.99% - 10.50%` | Th 1 (1 th)<br>Th 2-3 (2 th)<br>Th 4-6 (3 th)<br>Th 7-10 (4 th) | 12 – 15 Thn | **25 Thn** (Karyawan)<br>20 Thn (Wiraswasta) | 3% – 5% / **0% (Bebas)** |
| **Bank BTN** | **KPR BTN Berjenjang** & KPR BTN Gaesss | Th 1-3: `3.99% - 4.75%`<br>Th 4-6: `7.49% - 8.25%`<br>Th 7-10: `9.49% - 10.25%` | Th 1-3 (3 th)<br>Th 4-6 (3 th)<br>Th 7-10 (4 th) | 15 Thn | **30 Thn** (Milenial)<br>25 Thn (Wiraswasta) | 3% – 5% / 1% |
| **Bank Mandiri** | **KPR Angsuran Berjenjang** & Fixed Reguler | Th 1-3: `3.88% - 4.88%`<br>Th 4-6: `7.88% - 8.50%`<br>Th 7-10: `9.88% - 10.50%` | Th 1-3 (3 th)<br>Th 4-6 (3 th)<br>Th 7-10 (4 th) | 12 Thn | **25 Thn** (Karyawan)<br>20 Thn (Wiraswasta) | 3% – 5% / 1% – 2% |
| **Bank BRI** | **KPR BRI Berjenjang Promo** & BritAma | Th 1: `3.77%`<br>Th 2-3: `5.77%`<br>Th 4-6: `7.87%`<br>Th 7-10: `9.87%` | Th 1 (1 th)<br>Th 2-3 (2 th)<br>Th 4-6 (3 th)<br>Th 7-10 (4 th) | 10 – 15 Thn | **25 Thn** (Karyawan)<br>20 Thn (Wiraswasta) | 2.5% – 3% / 1% |
| **Bank BCA** | **Fix & Cap** & Fixed Berjenjang | • Fix 2-3 th: `5.00% - 6.00%`<br>• Cap 2-3 th: `7.50% - 8.00%`<br>• Jenjang Th 1-3: `3.75%`, Th 4-6: `7.25%`, Th 7-10: `9.25%` | Total Fix & Cap 5 th<br>Jenjang 10 th | 8 – 10 Thn | **20 Thn** (Karyawan)<br>15 – 20 Thn (Wiraswasta) | **2.00%** / **0% (Bebas)** |
| **Bank BNI** | **BNI Griya Berjenjang** & Griya Gue | Th 1-2: `3.75% - 4.25%`<br>Th 3-5: `6.75% - 7.50%`<br>Th 6-10: `8.75% - 9.75%` | Th 1-2 (2 th)<br>Th 3-5 (3 th)<br>Th 6-10 (5 th) | 15 Thn | **30 Thn** (Milenial)<br>20 Thn (Wiraswasta) | 2% – 3% / 1% |
| **BSI (Syariah)**| **BSI Griya Hasanah** (Murabahah) | Margin setara `7.50% – 8.75%` **FLAT/FIXED sepanjang masa tenor** | Sepanjang masa tenor (bebas floating) | 5 Thn | **30 Thn** (Simuda)<br>20 Thn (Wiraswasta) | **0% (Bebas Penalti)** |

---

## 📐 Logika & Rumus Finansial

### 1. Perhitungan Cicilan Bulanan (Anuitas)
Menggunakan formula anuitas standar perbankan:

$$PMT = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$

Dimana:
- $P$ = Sisa pokok pinjaman
- $r$ = Suku bunga per bulan ($\text{Suku Bunga Tahunan} / 1200$)
- $n$ = Sisa periode tenor dalam bulan

### 2. Pokok Pinjaman Baru (*Capitalized Fees*)
Pinjaman baru mengakomodasi sisa pokok lama ditambah biaya-biaya proses:
$$\text{Pokok Baru} = \text{Sisa Pokok} + \text{Biaya Admin} + \text{Provisi} + \text{Notaris} + \text{Appraisal} + \text{Asuransi}$$

*Catatan: Penalti pelunasan KPR lama diperlakukan sebagai biaya awal tunai (*upfront cost*) untuk analisis NPV dan kalkulasi break-even.*

### 3. Net Present Value (NPV)
Penghematan riil dihitung dengan mendiskontokan selisih cicilan bulanan:

$$NPV = -\text{Biaya Penalti} + \sum_{t=1}^{N} \frac{\Delta \text{Cicilan}_t}{\left(1 + \frac{d}{1200}\right)^t}$$

Dimana:
- $\Delta \text{Cicilan}_t = \text{Cicilan Lama}_t - \text{Cicilan Baru}_t$
- $d$ = Suku bunga diskonto tahunan (%)

---

## 🛠️ Struktur Proyek

```
kpr-refinance-model/
├── docs/                         # Dokumentasi riset & deployment
│   ├── deployment.md             # Panduan deployment GitHub Pages
│   └── market_research_kpr_indonesia.md # Riset pasar lengkap skema KPR Indonesia
├── index.html                    # Entry point HTML dengan meta tag dan favicon SVG
├── package.json                  # Konfigurasi dependensi dan scripts
├── vite.config.js                # Konfigurasi bundler Vite
├── src/
│   ├── main.jsx                  # React bootstrapping
│   ├── App.jsx                   # Orchestrator komponen utama
│   ├── index.css                 # Tailwind CSS, scrollbar custom, & media print
│   ├── constants/
│   │   ├── bankPresets.js        # Konfigurasi preset bank Indonesia (Mandiri, BTN, BRI, BCA, dll.)
│   │   └── defaults.js           # Nilai default skema suku bunga
│   ├── utils/
│   │   ├── format.js             # Formatter mata uang IDR & angka ringkas
│   │   ├── gemini.js             # Integrasi Google Gemini API & Mesin Optimasi Tenor
│   │   └── mortgage.js           # Mesin kalkulasi cicilan, jadwal amortisasi & suku bunga
│   ├── hooks/
│   │   ├── useDarkMode.js        # Hook pengelolaan preferensi tema gelap/terang
│   │   └── useRefinanceCalculator.js # Hook sentral logika state & kalkulasi finansial
│   └── components/
│       ├── chat/                 # Komponen AI Chatbot Advisor, Floating Trigger & Modal Key
│       ├── ui/                   # Komponen atomik: Card, Field, Metric, Tooltip, SchemeSelect
│       ├── forms/                # Form input KPR lama, bank baru, & biaya-biaya
│       ├── layout/               # Header dengan kontrol Dark Mode & Footer disclaimer
│       └── results/              # Banner rekomendasi, Metrics, Grafik, Tabel Amortisasi & Sensitivitas
```

---

## 🚀 Menjalankan Secara Lokal

Pastikan Anda telah menginstal **Node.js** (v18+ direkomendasikan).

1. Clone repositori ini:
   ```bash
   git clone https://github.com/gems-fn123/kpr-refinance-model.git
   cd kpr-refinance-model
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Buka browser di alamat yang tertera (biasanya `http://localhost:5173`).

4. Build untuk produksi:
   ```bash
   npm run build
   ```
   Hasil build siap deploy akan berada di folder `dist/`.

## 🌐 Deploy ke GitHub Pages

Aplikasi ini dipublikasikan sebagai GitHub Pages pada alamat berikut:

<https://gems-fn123.github.io/kpr-refinance-model/>

Untuk membuat ulang hasil deploy secara lokal:

```bash
npm install
npm run build
```

Folder `dist/` adalah hasil build produksi yang dikirim ke GitHub Pages melalui workflow GitHub Actions. Detail pengaturan Pages dan checklist deploy tersedia di [`docs/deployment.md`](docs/deployment.md).

---

## 📄 Lisensi & Disclaimer

Aplikasi ini dikembangkan untuk tujuan simulasi dan edukasi finansial independen. Perhitungan aktual pada perbankan dapat sedikit berbeda bergantung pada metode pembulatan, provisi khusus, ketentuan asuransi, serta regulasi OJK / Bank Indonesia.
