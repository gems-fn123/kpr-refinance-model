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

Workflow [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) membangun aplikasi dari branch `main`, mengunggah folder `dist/` sebagai artifact, lalu menerbitkannya ke GitHub Pages.

Pada GitHub, buka **Settings > Pages** dan ubah **Build and deployment > Source** menjadi **GitHub Actions**. Jangan gunakan **Deploy from a branch > `/ (root)`**, karena root repositori berisi source React dan `index.html` development, bukan hasil build Vite.

Setelah perubahan didorong ke `main`, pantau workflow **Deploy to GitHub Pages** pada tab **Actions** sampai job `deploy` selesai.

Setelah deploy selesai, buka URL produksi dan periksa hal-hal berikut:

- Halaman utama tampil tanpa error JavaScript.
- Grafik, tabel amortisasi, dan kontrol dark mode berfungsi.
- Refresh langsung pada URL aplikasi tetap menampilkan halaman.
- Tampilan responsif berfungsi pada desktop dan perangkat seluler.

## Catatan Vite

Karena aplikasi dipublikasikan pada subpath `/kpr-refinance-model/`, konfigurasi `vite.config.js` memakai base `/kpr-refinance-model/` saat build di GitHub Actions. Local development tetap memakai root `/`.

## Troubleshooting Singkat

- Jika aset CSS atau JavaScript gagal dimuat, periksa base path dan URL deploy.
- Jika halaman kosong, buka browser DevTools dan periksa error pada console.
- Jika perubahan belum terlihat, tunggu workflow selesai lalu lakukan hard refresh.