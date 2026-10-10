// `steps` = tahapan fixed berurutan (Fixed bertahap); `floatingRate` dipakai setelah tahap/masa fixed berakhir.
export const defaults = {
  old: {
    steps: [
      { years: 2, rate: 7.5 },
      { years: 3, rate: 9.5 }
    ],
    fixedYears: 3,
    fixedRate: 8.5,
    floatingRate: 12,
    fullFixedRate: 11
  },
  // Skema bertahap mengikuti contoh docs/market_research_kpr_indonesia.md §4 (Skenario A).
  newer: {
    steps: [
      { years: 3, rate: 4.5 },
      { years: 3, rate: 7.75 },
      { years: 4, rate: 9.75 }
    ],
    fixedYears: 5,
    fixedRate: 6.5,
    floatingRate: 11,
    fullFixedRate: 8.5
  }
};
