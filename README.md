# KPR Refinance Calculator

React + Vite web app untuk membandingkan ekonomi KPR lama dan refinancing. Repo ini sudah disiapkan sebagai **Power Apps Code App**.

## Prasyarat

- Node.js LTS
- Git
- Power Platform environment dengan **Power Apps code apps** sudah diaktifkan
- Hak akses untuk membuat aplikasi pada environment tersebut

## Instalasi

```bash
npm install --global @microsoft/power-apps-cli
npm install --global @microsoft/power-apps
npm install
```

## Jalankan sebagai web app biasa

```bash
npm run dev
```

## Inisialisasi Power Apps Code App

Cara interaktif:

```bash
pa app init
```

Atau langsung dengan Environment ID:

```bash
pa app init --display-name "KPR Refinance Calculator" --environment-id <ENVIRONMENT_ID>
```

Perintah ini membuat `power.config.json` yang terikat ke environment Anda. File tersebut belum disertakan karena Environment ID bersifat tenant-specific.

## Uji melalui Power Apps Local Play

```bash
pa app run
```

Buka URL **Local Play** menggunakan profil browser yang sama dengan akun Power Platform.

## Build dan deploy

```bash
npm run build
pa app push
```

Atau satu perintah:

```bash
npm run powerapps:push
```

## Push repo ke GitHub

```bash
git init
git add .
git commit -m "Initial Power Apps code app"
git branch -M main
git remote add origin https://github.com/USERNAME/kpr-refinance-calculator.git
git push -u origin main
```
