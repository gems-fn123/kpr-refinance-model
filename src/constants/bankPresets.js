// Sumber: docs/market_research_kpr_indonesia.md. Docs memberi rentang bunga per tahap; setiap nilai di sini
// berada di dalam rentang tersebut (bila tidak ada nilai pasti, dipakai nilai tengah rentang).
// Skema "step": `steps` = tahapan fixed berurutan, `floatingRate` = bunga floating setelah tahap terakhir.
export const bankPresets = [
  {
    id: "mandiri-step",
    bank: "Bank Mandiri",
    name: "Mandiri KPR Angsuran Berjenjang 10 Thn",
    badge: "BUMN",
    scheme: "step",
    minTenor: 12,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      steps: [
        { years: 3, rate: 4.25 },
        { years: 3, rate: 8.25 },
        { years: 4, rate: 10.19 }
      ],
      floatingRate: 11.5
    },
    description: "3 tahap fixed 10 thn, floating mulai th 11. Min tenor 12 thn. Penalti 3–5% selama th 1–10."
  },
  {
    id: "mandiri-fix3",
    bank: "Bank Mandiri",
    name: "Mandiri KPR Fix 3 Thn",
    badge: "BUMN",
    scheme: "fixedFloating",
    minTenor: 8,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      fixedYears: 3,
      fixedRate: 5.88,
      floatingRate: 11.75
    },
    description: "Fixed 3 th 5.88%, selanjutnya floating pasar ~11.75%."
  },
  {
    id: "btn-gaesss",
    bank: "Bank BTN",
    name: "BTN KPR Gaesss Berjenjang (Milenial)",
    badge: "BUMN",
    scheme: "step",
    minTenor: 15,
    maxTenor: 30,
    defaultTenor: 20,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      steps: [
        { years: 3, rate: 3.99 },
        { years: 3, rate: 7.75 },
        { years: 4, rate: 9.87 }
      ],
      floatingRate: 12.0
    },
    description: "Tenor s.d. 30 thn! 3 tahap fixed 10 thn, floating mulai th 11. Min tenor 15 thn. Grace period pokok (Gaesss) tidak dimodelkan."
  },
  {
    id: "btn-fix3",
    bank: "Bank BTN",
    name: "BTN KPR Platinum Fix 3 Thn",
    badge: "BUMN",
    scheme: "fixedFloating",
    minTenor: 10,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      fixedYears: 3,
      fixedRate: 5.99,
      floatingRate: 12.0
    },
    description: "Fixed 3 th 5.99%, selanjutnya floating ~12.0%."
  },
  {
    id: "bri-step",
    bank: "Bank BRI",
    name: "BRI KPR Bunga Berjenjang Promo",
    badge: "BUMN",
    scheme: "step",
    minTenor: 10,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      steps: [
        { years: 1, rate: 3.77 },
        { years: 2, rate: 5.77 },
        { years: 3, rate: 7.87 },
        { years: 4, rate: 9.87 }
      ],
      floatingRate: 11.75
    },
    description: "4 tahap fixed 10 thn, floating mulai th 11. Min tenor 10 thn (paket 20 thn: 15 thn). Penalti 2.5–3% selama th 1–10."
  },
  {
    id: "bri-fix3",
    bank: "Bank BRI",
    name: "BRI KPR Fix 3 Thn Promo",
    badge: "BUMN",
    scheme: "fixedFloating",
    minTenor: 10,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      fixedYears: 3,
      fixedRate: 5.75,
      floatingRate: 11.75
    },
    description: "Fixed 3 th 5.75%, selanjutnya floating ~11.75%."
  },
  {
    id: "cimb-step",
    bank: "CIMB Niaga",
    name: "CIMB Niaga KPR Xtra Berjenjang",
    badge: "Swasta",
    scheme: "step",
    minTenor: 12,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      steps: [
        { years: 1, rate: 4.03 },
        { years: 2, rate: 6.62 },
        { years: 3, rate: 8.5 },
        { years: 4, rate: 10.25 }
      ],
      floatingRate: 11.25
    },
    description: "4 tahap fixed 10 thn, floating mulai th 11. Min tenor 12–15 thn. Penalti 3–5% selama th 1–10, 0–1% saat floating."
  },
  {
    id: "cimb-fix3",
    bank: "CIMB Niaga",
    name: "CIMB Niaga KPR Xtra Fix 3 Thn",
    badge: "Swasta",
    scheme: "fixedFloating",
    minTenor: 8,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 1000000,
    cfg: {
      fixedYears: 3,
      fixedRate: 5.25,
      floatingRate: 11.25
    },
    description: "Fixed 3 th 5.25%, floating ~11.25%. Bebas denda pelunasan di masa floating."
  },
  {
    id: "bca-fixcap",
    bank: "Bank BCA",
    name: "BCA KPR Fix & Cap 5 Thn",
    badge: "Swasta",
    scheme: "step",
    minTenor: 8,
    maxTenor: 20,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      steps: [
        { years: 2, rate: 5.25 },
        { years: 3, rate: 7.75 }
      ],
      floatingRate: 10.75
    },
    description: "Fix th 1–2 5.25%, Cap th 3–5 maks 7.75% (dihitung pada batas cap = skenario terburuk), floating mulai th 6. Min tenor 8 thn."
  },
  {
    id: "bca-step",
    bank: "Bank BCA",
    name: "BCA KPR Berjenjang 10 Thn",
    badge: "Swasta",
    scheme: "step",
    minTenor: 10,
    maxTenor: 20,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      steps: [
        { years: 3, rate: 4.25 },
        { years: 3, rate: 7.5 },
        { years: 4, rate: 9.5 }
      ],
      floatingRate: 10.75
    },
    description: "Paket 10 thn: 3 tahap fixed, floating BCA (~10.75%, terkenal stabil) hanya berlaku bila tenor > 10 thn. Min tenor 10 thn."
  },
  {
    id: "bca-fix2-free",
    bank: "Bank BCA",
    name: "BCA KPR Fix 2 Thn (Bebas Penalti)",
    badge: "Swasta",
    scheme: "fixedFloating",
    minTenor: 3,
    maxTenor: 20,
    defaultTenor: 10,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      fixedYears: 2,
      fixedRate: 3.88,
      floatingRate: 10.75
    },
    description: "Bebas denda pelunasan 0% setelah tahun ke-2! Cocok untuk strategi refinancing pendek."
  },
  {
    id: "bni-step",
    bank: "Bank BNI",
    name: "BNI Griya Berjenjang (Griya Gue)",
    badge: "BUMN",
    scheme: "step",
    minTenor: 15,
    maxTenor: 30,
    defaultTenor: 20,
    provisionPct: 0.5,
    adminFee: 750000,
    cfg: {
      steps: [
        { years: 2, rate: 3.99 },
        { years: 3, rate: 7.25 },
        { years: 5, rate: 9.25 }
      ],
      floatingRate: 11.75
    },
    description: "Khusus milenial, tenor s.d. 30 thn. 3 tahap fixed 10 thn, floating mulai th 11. Min tenor 15 thn."
  },
  {
    id: "bsi-syariah",
    bank: "Bank Syariah Indonesia (BSI)",
    name: "BSI Griya Hasanah (Full Fixed Murabahah)",
    badge: "Syariah",
    scheme: "full",
    minTenor: 5,
    maxTenor: 30,
    defaultTenor: 15,
    provisionPct: 0,
    adminFee: 750000,
    cfg: {
      fullFixedRate: 7.75
    },
    description: "Margin flat 7.75% pasti sampai lunas! 0% Provisi, 0% Denda Penalti, bebas risiko floating."
  },
  {
    id: "ocbc-easystart",
    bank: "OCBC",
    name: "OCBC KPR Easy Start",
    badge: "Swasta",
    scheme: "step",
    minTenor: 10,
    maxTenor: 25,
    defaultTenor: 15,
    provisionPct: 1,
    adminFee: 750000,
    cfg: {
      steps: [
        { years: 2, rate: 4.15 },
        { years: 3, rate: 7.25 }
      ],
      floatingRate: 11.5
    },
    description: "Cicilan awal super ringan untuk profesional muda, kenaikan bertahap tiap 2-3 tahun."
  }
];
