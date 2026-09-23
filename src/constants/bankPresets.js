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
      step1Years: 3,
      step1Rate: 4.25,
      step2Years: 3,
      step2Rate: 8.25,
      step3Rate: 11.5
    },
    description: "Fixed 3 th pertama 4.25%, th 4-6 8.25%, sisa floating ~11.5%. Min tenor 12 thn."
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
      step1Years: 3,
      step1Rate: 3.99,
      step2Years: 3,
      step2Rate: 7.75,
      step3Rate: 12.0
    },
    description: "Tenor s.d. 30 thn! Fixed th 1-3 3.99%, th 4-6 7.75%, sisa floating ~12.0%."
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
      step1Years: 3,
      step1Rate: 4.77,
      step2Years: 3,
      step2Rate: 7.87,
      step3Rate: 11.75
    },
    description: "Th 1-3 rata-rata 4.77%, th 4-6 7.87%, floating ~11.75%. Min tenor 10 thn."
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
      step1Years: 3,
      step1Rate: 5.5,
      step2Years: 3,
      step2Rate: 8.5,
      step3Rate: 11.25
    },
    description: "Th 1-3 rata-rata 5.50%, th 4-6 8.50%, sisa floating ~11.25%."
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
      step1Years: 2,
      step1Rate: 5.25,
      step2Years: 3,
      step2Rate: 7.75,
      step3Rate: 10.75
    },
    description: "Fix 2 th 5.25%, Cap 3 th maks 7.75%, sisa floating ~10.75%. Min tenor 8 thn."
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
      step1Years: 3,
      step1Rate: 4.25,
      step2Years: 3,
      step2Rate: 7.5,
      step3Rate: 10.75
    },
    description: "Th 1-3 4.25%, th 4-6 7.50%, floating ~10.75% (terkenal stabil)."
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
      step1Years: 2,
      step1Rate: 3.99,
      step2Years: 3,
      step2Rate: 7.25,
      step3Rate: 11.75
    },
    description: "Khusus milenial s.d. 30 tahun. Th 1-2 3.99%, th 3-5 7.25%, floating ~11.75%."
  },
  {
    id: "bsi-syariah",
    bank: "Bank Syariah Indonesia (BSI)",
    name: "BSI Griya Hasanah (Full Fixed Murabahah)",
    badge: "Syariah",
    scheme: "fullFixed",
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
      step1Years: 2,
      step1Rate: 4.15,
      step2Years: 3,
      step2Rate: 7.25,
      step3Rate: 11.5
    },
    description: "Cicilan awal super ringan untuk profesional muda, kenaikan bertahap tiap 2-3 tahun."
  }
];
