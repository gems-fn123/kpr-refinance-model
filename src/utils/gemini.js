import { schedule } from "./mortgage";
import { idr, formatCompact } from "./format";

const STORAGE_KEY = "gemini_api_key";

export function getSavedApiKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || "";
}

export function saveApiKey(key) {
  if (typeof window === "undefined") return;
  if (!key) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

/**
 * Calculates comparative simulation across multiple tenors
 * based on the active scheme and loan settings.
 */
export function calculateTenorOptimization(state, result) {
  const {
    balance,
    remainingYears,
    oldScheme,
    oldCfg,
    oldMonthlyFee,
    newScheme,
    newCfg,
    penalty,
    discountRate
  } = state;

  const newPrincipal = result.newPrincipal;
  const penaltyCost = result.penaltyCost;

  // Candidate tenors to simulate
  const candidateTenors = [5, 8, 10, 12, 15, 20, 25, 30].filter(t => t >= 3);

  const oldSchedule = schedule(balance, remainingYears, oldScheme, oldCfg, oldMonthlyFee);
  const oldFirstPayment = oldSchedule.rows[0]?.payment || 0;
  const oldTotalPayment = oldSchedule.totalPayment;

  const simulations = candidateTenors.map(tenor => {
    const newerSchedule = schedule(newPrincipal, tenor, newScheme, newCfg);
    const firstPayment = newerSchedule.rows[0]?.payment || 0;
    const totalPayment = newerSchedule.totalPayment;
    const totalInterest = newerSchedule.totalInterest;

    const maxMonths = Math.max(oldSchedule.rows.length, newerSchedule.rows.length);
    let cumulative = -penaltyCost;
    let npv = -penaltyCost;
    let breakEven = null;

    for (let i = 0; i < maxMonths; i++) {
      const saving = (oldSchedule.rows[i]?.payment || 0) - (newerSchedule.rows[i]?.payment || 0);
      cumulative += saving;
      npv += saving / Math.pow(1 + discountRate / 1200, i + 1);

      if (breakEven === null && cumulative >= 0) {
        breakEven = i + 1;
      }
    }

    const monthlySavingYear1 = oldFirstPayment - firstPayment;
    const totalSaving = oldTotalPayment - (totalPayment + penaltyCost);

    return {
      tenor,
      firstPayment,
      totalPayment,
      totalInterest,
      monthlySavingYear1,
      totalSaving,
      npv,
      breakEven,
      isViable: npv > 0 && monthlySavingYear1 > 0
    };
  });

  // Determine key recommendations
  const viable = simulations.filter(s => s.npv > 0);

  // 1. Min Interest: Lowest tenor among viable that saves the most interest
  const minInterest = [...viable].sort((a, b) => a.totalInterest - b.totalInterest)[0] || simulations[0];

  // 2. Lightest Monthly Cash Flow: Highest viable tenor with lowest first payment
  const lightCashFlow = [...viable].sort((a, b) => a.firstPayment - b.firstPayment)[0] || simulations[simulations.length - 1];

  // 3. Sweet Spot: Near remainingYears or optimal balance between BEP, NPV, and monthly relief
  let sweetSpot = viable.find(s => s.tenor === remainingYears);
  if (!sweetSpot) {
    sweetSpot = [...viable].sort((a, b) => {
      // Balance high NPV with reasonable breakEven (score based)
      const scoreA = a.npv / (a.breakEven || 999);
      const scoreB = b.npv / (b.breakEven || 999);
      return scoreB - scoreA;
    })[0] || simulations.find(s => s.tenor === 15) || simulations[0];
  }

  return {
    simulations,
    recommendations: {
      sweetSpot,
      minInterest,
      lightCashFlow
    },
    oldFirstPayment,
    oldTotalPayment,
    newPrincipal,
    currentYears: state.newYears
  };
}

/**
 * Builds the financial prompt context string to feed to Gemini
 */
export function buildFinancialContext(state, result, optimization) {
  const { sweetSpot, minInterest, lightCashFlow } = optimization.recommendations;

  return `
DATA AKTUAL SIMULASI KPR USER:
- Nilai Properti: ${idr.format(state.propertyValue)}
- Sisa Pokok KPR Lama: ${idr.format(state.balance)}
- Sisa Tenor KPR Lama: ${state.remainingYears} tahun
- Skema KPR Lama: ${state.oldScheme}
- Cicilan Bulanan KPR Lama Saat Ini: ${idr.format(optimization.oldFirstPayment)} / bulan
- Total Pembayaran KPR Lama s.d Lunas: ${idr.format(optimization.oldTotalPayment)}

KPR BARU YANG SEDANG DIKONFIGURASI:
- Pokok Pinjaman Baru (termasuk biaya proses): ${idr.format(result.newPrincipal)}
- Skema Bunga Baru: ${state.newScheme}
- Tenor Baru Saat Ini: ${state.newYears} tahun
- Cicilan Baru Saat Ini: ${idr.format(result.firstNew)} / bulan
- Selisih Penghematan Cicilan Bulan Pertama: ${idr.format(optimization.oldFirstPayment - result.firstNew)} / bulan
- Biaya Penalti KPR Lama (${state.penalty}%): ${idr.format(result.penaltyCost)}
- Total Biaya Proses Refinancing: ${idr.format(result.processFees)}
- Status Kelayakan LTV: ${result.eligible ? "Lolos LTV" : "Melebihi Batas LTV"}
- NPV Saat Ini: ${idr.format(result.npv)}
- Break-Even Point Saat Ini: ${result.breakEven ? result.breakEven + " bulan" : "Tidak tercapai"}

HASIL ANALISIS KUANTITATIF BERBAGAI PILIHAN TENOR:
${optimization.simulations.map(s => 
  `• Tenor ${s.tenor} Thn: Cicilan ${idr.format(s.firstPayment)}/bln | Hemat cicilan: ${idr.format(s.monthlySavingYear1)}/bln | Total Bunga: ${idr.format(s.totalInterest)} | NPV: ${idr.format(s.npv)} | BEP: ${s.breakEven ? s.breakEven + ' bln' : 'Gagal'}`
).join("\n")}

REKOMENDASI SISTEM:
1. Rekomendasi Seimbang (Sweet Spot): Tenor ${sweetSpot.tenor} Tahun (Cicilan ${idr.format(sweetSpot.firstPayment)}, NPV ${idr.format(sweetSpot.npv)}, BEP ${sweetSpot.breakEven} bln)
2. Rekomendasi Paling Hemat Bunga: Tenor ${minInterest.tenor} Tahun (Total Bunga ${idr.format(minInterest.totalInterest)}, NPV ${idr.format(minInterest.npv)})
3. Rekomendasi Cicilan Paling Ringan: Tenor ${lightCashFlow.tenor} Tahun (Cicilan ${idr.format(lightCashFlow.firstPayment)}/bln)
`;
}

/**
 * Fallback response generator if user has not provided an API Key.
 * Generates an instant, highly detailed expert recommendation for free!
 */
export function generateLocalAdvisory(state, result, optimization) {
  const { sweetSpot, minInterest, lightCashFlow } = optimization.recommendations;
  const currentTenor = state.newYears;

  return `### 🎯 Analisis Tenor KPR Paling Optimal untuk Anda

Berdasarkan skema **${state.newScheme === "step" ? "Fixed Berjenjang (Step-Up)" : state.newScheme === "fixedFloating" ? "Fixed lalu Floating" : "Full Fixed"}** dengan sisa pokok **${idr.format(state.balance)}**, berikut evaluasi matematis tenor paling menguntungkan:

---

#### 🌟 1. Rekomendasi Terbaik (Sweet Spot): **Tenor ${sweetSpot.tenor} Tahun**
* **Cicilan Bulanan Awal:** **${idr.format(sweetSpot.firstPayment)} / bulan**
* **Penghematan Kas Bulanan:** **+${idr.format(sweetSpot.monthlySavingYear1)} / bulan** lebih hemat dibanding bank lama Anda (${idr.format(optimization.oldFirstPayment)}/bln).
* **Net Present Value (NPV):** **+${idr.format(sweetSpot.npv)}** (*keuntungan finansial bersih riil setelah memperhitungkan inflasi & biaya*).
* **Titik Impas (Break-Even Point):** Tercapai dalam **${sweetSpot.breakEven ? sweetSpot.breakEven + " bulan" : "-"}**.
* **Alasan:** Tenor ini memberikan keseimbangan ideal antara penurunan beban cicilan bulanan yang signifikan tanpa memperpanjang total waktu utang Anda secara berlebihan.

---

#### 💰 2. Pilihan Paling Hemat Bunga Total: **Tenor ${minInterest.tenor} Tahun**
* **Cicilan Bulanan Awal:** **${idr.format(minInterest.firstPayment)} / bulan**
* **Total Bunga yang Dibayar:** **${idr.format(minInterest.totalInterest)}** (Termurah di antara semua opsi).
* **NPV Penghematan:** **+${idr.format(minInterest.npv)}**
* **Cocok untuk:** Anda yang memiliki *cash flow* bulanan longgar dan ingin pinjaman lunas secepat mungkin untuk meminimalkan beban bunga ke bank.

---

#### 🛡️ 3. Pilihan Cicilan Paling Ringan (Cash Flow Safe): **Tenor ${lightCashFlow.tenor} Tahun**
* **Cicilan Bulanan Awal:** **${idr.format(lightCashFlow.firstPayment)} / bulan** (Cicilan terendah).
* **Pelegaan Cash Flow:** **+${idr.format(lightCashFlow.monthlySavingYear1)} / bulan**.
* **Catatan:** Total bunga jangka panjang lebih tinggi (**${idr.format(lightCashFlow.totalInterest)}**), namun sangat aman untuk rasio DSR (Debt Service Ratio) jika ada kebutuhan finansial keluarga lainnya.

---

💡 *Status Tenor Anda Saat Ini (${currentTenor} Tahun):* Cicilan ${idr.format(result.firstNew)}/bln dengan NPV ${idr.format(result.npv)}.

> 🔑 **Ingin tanya jawab interaktif lanjutan?** Masukkan API Key Google Gemini (100% Gratis dari [Google AI Studio](https://aistudio.google.com/app/apikey)) melalui tombol pengaturan di atas untuk berkonsultasi secara bebas dengan AI!`;
}

/**
 * Calls Google Gemini REST API with fallback models (gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash)
 */
export async function askGeminiAdvisor({ apiKey, prompt, messages = [], state, result }) {
  const optimization = calculateTenorOptimization(state, result);
  const financialContext = buildFinancialContext(state, result, optimization);

  if (!apiKey) {
    // Return instant local analysis if no API key
    return {
      text: generateLocalAdvisory(state, result, optimization),
      optimization,
      isLocal: true
    };
  }

  const systemInstruction = `Anda adalah Senior Mortgage & Refinancing Financial Advisor di Indonesia. 
Tugas Anda adalah memberikan saran tenor KPR dan strategi refinancing yang PALING OPTIMAL secara matematis, psikologis, dan likuiditas bagi debitur.
Gunakan data finansial berikut sebagai referensi mutlak:
${financialContext}

Panduan komunikasi:
1. Berikan rekomendasi tenor yang tegas dan sebutkan nominal cicilan, penghematan, NPV, dan titik impas (BEP).
2. Jelaskan trade-off antara tenor pendek (hemat bunga total tapi cicilan lebih besar) vs tenor panjang (cicilan ringan tapi bunga total bengkak).
3. Berikan saran praktis terkait risiko suku bunga floating di tahun-tahun mendatang dan holding period penalti bank.
4. Gunakan bahasa Indonesia yang ramah, profesional, bernas, dan format Markdown yang rapi dengan bullet points dan tebal (bold).
`;

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  // Format message history
  const contents = [];
  
  // Include system instruction as initial context
  contents.push({
    role: "user",
    parts: [{ text: `[SYSTEM INSTRUCTION & FINANCIAL CONTEXT]\n${systemInstruction}\n\n[USER QUESTION]\n${prompt}` }]
  });

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Model ${model} gagal: ${message}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answer) {
        return {
          text: answer,
          optimization,
          isLocal: false
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed, trying next fallback...`, err);
    }
  }

  // If all Gemini calls failed, fallback to local advisory with error note
  return {
    text: `${generateLocalAdvisory(state, result, optimization)}\n\n*(Catatan: Panggilan ke Gemini API mengalami kendala: ${lastError?.message || "Koneksi terputus"}. Analisis di atas dihasilkan oleh Mesin Kalkulasi Optimasi Finansial Lokal)*`,
    optimization,
    isLocal: true
  };
}
