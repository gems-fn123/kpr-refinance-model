# KPR Refinance Calculator 🏦

Aplikasi web modern, interaktif, dan komprehensif untuk simulasi dan analisis kelayakan **Refinancing KPR (Kredit Pemilikan Rumah)** di Indonesia. Membantu debitur membandingkan KPR bank saat ini dengan penawaran KPR take-over / refinance bank baru secara mendalam.

**Live demo:** [gems-fn123.github.io/kpr-refinance-model](https://gems-fn123.github.io/kpr-refinance-model/)

---

## ✨ Fitur Utama

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
├── index.html                    # Entry point HTML dengan meta tag dan favicon SVG
├── package.json                  # Konfigurasi dependensi dan scripts
├── vite.config.js                # Konfigurasi bundler Vite
├── src/
│   ├── main.jsx                  # React bootstrapping
│   ├── App.jsx                   # Orchestrator komponen utama
│   ├── index.css                 # Tailwind CSS, scrollbar custom, & media print
│   ├── constants/
│   │   └── defaults.js           # Nilai default skema suku bunga
│   ├── utils/
│   │   ├── format.js             # Formatter mata uang IDR & angka ringkas
│   │   └── mortgage.js           # Mesin kalkulasi cicilan, jadwal amortisasi & suku bunga
│   ├── hooks/
│   │   ├── useDarkMode.js        # Hook pengelolaan preferensi tema gelap/terang
│   │   └── useRefinanceCalculator.js # Hook sentral logika state & kalkulasi finansial
│   └── components/
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

Folder `dist/` adalah hasil build produksi yang digunakan oleh GitHub Pages. Detail pengaturan Pages dan checklist deploy tersedia di [`docs/deployment.md`](docs/deployment.md).

---

## 📄 Lisensi & Disclaimer

Aplikasi ini dikembangkan untuk tujuan simulasi dan edukasi finansial independen. Perhitungan aktual pada perbankan dapat sedikit berbeda bergantung pada metode pembulatan, provisi khusus, ketentuan asuransi, serta regulasi OJK / Bank Indonesia.
