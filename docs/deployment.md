# Deployment ke GitHub Pages

Dokumen ini menjelaskan cara mempublikasikan KPR Refinance Calculator ke GitHub Pages.

## URL Produksi

<https://gems-fn123.github.io/kpr-refinance-model/>

## Prasyarat

- Node.js 18 atau versi yang lebih baru
- Akses push ke repositori `gems-fn123/kpr-refinance-model`
- GitHub Pages aktif pada repositori

## Build Lokal

Jalankan perintah berikut dari root repositori:

```bash
npm install
npm run build
```

Vite menghasilkan aset produksi di folder `dist/`. Periksa hasil build secara lokal dengan:

```bash
npm run preview
```

## Pengaturan GitHub Pages

Pada GitHub, buka **Settings > Pages**, lalu pastikan sumber deploy menggunakan workflow GitHub Actions atau branch yang telah dikonfigurasi untuk menyajikan folder `dist/`.

Setelah deploy selesai, buka URL produksi dan periksa hal-hal berikut:

- Halaman utama tampil tanpa error JavaScript.
- Grafik, tabel amortisasi, dan kontrol dark mode berfungsi.
- Refresh langsung pada URL aplikasi tetap menampilkan halaman.
- Tampilan responsif berfungsi pada desktop dan perangkat seluler.

## Catatan Vite

Karena aplikasi dipublikasikan pada root GitHub Pages untuk repositori ini, URL produksi menggunakan path `/kpr-refinance-model/`. Jika target hosting berubah ke subpath lain, periksa kembali konfigurasi `base` di `vite.config.js` sebelum deploy.

## Troubleshooting Singkat

- Jika aset CSS atau JavaScript gagal dimuat, periksa base path dan URL deploy.
- Jika halaman kosong, buka browser DevTools dan periksa error pada console.
- Jika perubahan belum terlihat, tunggu workflow selesai lalu lakukan hard refresh.