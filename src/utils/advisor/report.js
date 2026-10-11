// Turns an analyzeRefinance() result into Markdown: the offline advisor report and the data block given to Gemini.
// Every option is always shown with its rate scheme, tenor and installments per stage.
import { schedule, SCHEME_LABELS } from "../mortgage.js";
import { CASES, SAME_TENOR_RULE, monthLabel } from "./analysis.js";

const nf1 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 3,04 jt" for installments, "Rp 156,9 jt" for totals. */
export const jt = (x, digits = 1) => `Rp ${(digits === 2 ? nf2 : nf1).format((x || 0) / 1e6)} jt`;
export const sjt = (x, digits = 1) => `${x >= 0 ? "+" : "−"}${jt(Math.abs(x), digits)}`;
const pct = (x) => `${nf2.format(x || 0)}%`;
const plainPct = (x) => `${nf2.format(x || 0).replace(/,00$/, "")}%`;
const signedPct = (x) => `${x >= 0 ? "+" : "−"}${plainPct(Math.abs(x))}`;
const rp = (x) => `Rp ${nf0.format(Math.round(x || 0))}`;

/** "14 th · 168 bln · lunas Sep 2040"; `startOffset` = installments paid on the old loan before switching. */
export function tenorText(months, today, startOffset = 0) {
  const years = months / 12;
  const y = Number.isInteger(years) ? `${years} th` : `${nf2.format(years)} th`;
  return today ? `${y} · ${months} bln · lunas ${monthLabel(today, startOffset + months)}` : `${y} · ${months} bln`;
}

const breakEvenText = (e) => e.breakEven === null
  ? "tidak balik modal"
  : `bln ke-${e.breakEven}`;

/** Installment per rate stage of a plan, e.g. "Th 1–3 4,25% Rp 3,04 jt → … → Floating 10,75% Rp 3,92 jt". */
export function planStages(preset, option) {
  const s = schedule(option.principal, option.tenorMonths / 12, preset.scheme, preset.cfg);
  const stages = [];
  s.rows.forEach((r, i) => {
    const last = stages[stages.length - 1];
    if (last && last.rate === r.rate && last.stage === r.stage) last.end = i + 1;
    else stages.push({ stage: r.stage, rate: r.rate, payment: r.payment, start: i + 1, end: i + 1 });
  });
  return stages.map(st => {
    const range = (st.start - 1) % 12 === 0 && st.end % 12 === 0
      ? `Th ${(st.start - 1) / 12 + 1}${st.end / 12 > (st.start - 1) / 12 + 1 ? `–${st.end / 12}` : ""}`
      : `Bln ${st.start}–${st.end}`;
    return `${range} ${st.stage === "Floating" ? "floating" : "fixed"} ${pct(st.rate)} → ${jt(st.payment, 2)}`;
  });
}

function optionBlock(analysis, o, key, rank) {
  const e = o[key];
  const p = o.preset;
  const lines = [
    `**${rank ? `${rank}. ` : ""}${p.name}** (${p.bank})`,
    `- Tenor: **${tenorText(e.tenorMonths, analysis.today)}**`,
    `- Skema ${SCHEME_LABELS[p.scheme].toLowerCase()} & cicilan: ${planStages(p, e).join(" · ")}`,
    `- Hemat total ${sjt(e.saving)} · NPV ${sjt(e.npv)} · Balik modal: ${breakEvenText(e)}`
  ];
  if (e.switchGain !== null && e.switchGain !== undefined) {
    lines.push(`- Untung murni pindah bank (vs tetap di bank lama + prepay ke tenor sama): ${sjt(e.switchGain)}`);
  }
  if (e.withinCap === false) lines.push(`- ⚠️ Cicilan tertinggi ${jt(e.peak, 2)} melebihi batas ${jt(analysis.assumptions.installmentCap, 2)}`);
  const notes = [...(p.notes || [])];
  if (p.notInDocs) notes.unshift("Produk ini tidak tercantum di docs riset; parameternya belum terverifikasi.");
  if (notes.length) lines.push(`- Catatan: ${notes.join(" ")}`);
  return lines.join("\n");
}

function compactTable(analysis, key, limit) {
  const rows = analysis.ranked[key].filter(o => o[key]).slice(0, limit);
  const head = "| Opsi | Tenor | Cicilan awal→puncak | Hemat / NPV |\n|---|---|---|---|";
  const body = rows.map(o => {
    const e = o[key];
    return `| ${o.preset.name} | ${nf2.format(e.tenorMonths / 12).replace(/,00$/, "")} th | ${nf2.format(e.first / 1e6)}→${nf2.format(e.peak / 1e6)} jt${e.withinCap === false ? " ⚠️" : ""} | ${sjt(e.saving)} / ${sjt(e.npv)} |`;
  });
  return [head, ...body].join("\n");
}

function verdictText(analysis) {
  const v = analysis.verdict;
  const byId = (id) => analysis.options.find(o => o.preset.id === id);
  if (v.type === "stay") {
    return `**${v.title}.** Tidak ada bank yang rencana optimalnya untung secara material (NPV > ${jt(analysis.assumptions.materiality)}), untung secara nominal, dan sekaligus mengalahkan opsi tetap di bank lama + prepay.`;
  }
  const o = byId(v.presetId);
  if (v.type === "wait") {
    const t = analysis.timing;
    const later = t.options.find(x => x.id === v.presetId);
    const nowBest = analysis.ranked.optimal[0];
    return `**${v.title}.** Bunga KPR Anda naik dari ${pct(t.fromRate)} ke ${pct(t.toRate)} mulai ${t.label}. Rencana terbaik: pindah ke **${o.preset.name}** tepat sebelum itu, tenor ${tenorText(later.tenorMonths, analysis.today, t.offset)}, dengan NPV ${sjt(later.npvToday)} (dihitung ke hari ini). Pindah sekarang paling bagus hanya ${sjt(nowBest.optimal.npv)} (${nowBest.preset.name}), karena Anda melepas sisa bulan berbunga ${pct(t.fromRate)}. Keyakinan: ${v.confidence}.`;
  }
  return `**${v.title}**, tenor ${tenorText(v.tenorMonths, analysis.today)}. NPV ${sjt(o.optimal.npv)}, hemat total ${sjt(o.optimal.saving)}. Keyakinan: ${v.confidence}.`;
}

function oldLoanSection(analysis) {
  const old = analysis.old;
  const stages = old.stages.map(s => `${s.from}–${s.to} ${s.stage === "Floating" ? "floating" : "fixed"} ${pct(s.rate)} → ${jt(s.payment, 2)}`);
  return [
    `### 🏠 KPR Anda saat ini${old.bank ? ` (${old.bank})` : ""}`,
    `- Sisa pokok ${jt(old.balance)} · sisa tenor ${tenorText(old.remainingMonths, analysis.today)}`,
    `- Skema & cicilan dari bulan ini: ${stages.join(" · ")}`,
    `- Total sisa bayar ${jt(old.total)} (bunga ${jt(old.interest)})`
  ].join("\n");
}

function definitions(analysis) {
  const a = analysis.assumptions;
  const capSource = a.installmentCapSource === "user" ? "batas yang Anda isi" : "cicilan tertinggi KPR Anda saat ini";
  return [
    "### 📖 Cara membaca",
    `- ${CASES.cepat.icon} **${CASES.cepat.label}**: ${CASES.cepat.rule}.`,
    `- ${CASES.optimal.icon} **${CASES.optimal.label}**: ${CASES.optimal.rule}. Batas cicilan: **${jt(a.installmentCap, 2)}/bln** (${capSource}).`,
    `- ${CASES.ringan.icon} **${CASES.ringan.label}**: ${CASES.ringan.rule}.`,
    `- **NPV** = nilai hari ini dari selisih cicilan (discount rate ${plainPct(a.discountRate)}), dikurangi penalti. **Hemat total** = nominal, sudah termasuk penalti & biaya proses. **Balik modal** = bulan setelah akumulasi hemat tidak pernah negatif lagi.`
  ].join("\n");
}

function assumptionsSection(analysis) {
  const a = analysis.assumptions;
  const first = analysis.options[0];
  return [
    "### 🧾 Asumsi",
    `- Penalti pelunasan bank lama ${plainPct(a.penaltyPct)} = **${jt(first.optimal?.penalty ?? first.sameTenor.penalty)} dibayar tunai** di awal (cek klausul di perjanjian kredit).`,
    `- Biaya proses dibiayai ke pinjaman baru: provisi & admin sesuai bank, notaris ${rp(a.notaryFee)}, appraisal ${rp(a.appraisalFee)}, asuransi ${rp(a.insuranceFee)}.`,
    "- Suku bunga & tahapan bank baru dari preset riset (docs); promo bisa berubah, minta penawaran tertulis (SPPK) sebelum memutuskan.",
    "- Bank menghitung ulang cicilan dari sisa pokok & sisa tenor setiap ganti tahap bunga (anuitas)."
  ].join("\n");
}

function timingSection(analysis) {
  const t = analysis.timing;
  if (!t) return null;
  const rows = [...t.options]
    .filter(x => analysis.ranked.optimal.some(o => o.preset.id === x.id))
    .sort((a, b) => b.npvToday - a.npvToday)
    .slice(0, 5)
    .map(x => {
      const o = analysis.options.find(op => op.preset.id === x.id);
      return `| ${o.preset.name} | ${o.optimal ? sjt(o.optimal.npv) : "—"} | ${sjt(x.npvToday)} (${nf2.format(x.tenorMonths / 12).replace(/,00$/, "")} th) |`;
    });
  return [
    `### ⏱️ Kapan sebaiknya pindah?`,
    `Bunga KPR Anda naik ${pct(t.fromRate)} → ${pct(t.toRate)} mulai **${t.label}**. NPV rencana optimal (dihitung ke hari ini):`,
    "| Opsi | Pindah sekarang | Pindah " + t.label + " |\n|---|---|---|",
    ...rows,
    "_Asumsi: promo bank masih sama saat itu (tidak dijamin)._"
  ].join("\n");
}

function sensitivitySection(analysis) {
  const name = (id) => analysis.options.find(o => o.preset.id === id)?.preset.name || id;
  return [
    "### 🔬 Uji sensitivitas (peringkat Optimal)",
    ...analysis.sensitivity.map(s => `- ${s.label}: ${s.top.map(t => `${name(t.id)} ${sjt(t.npv)}`).join(", ") || "tidak ada opsi"}`)
  ].join("\n");
}

function risksSection(analysis) {
  const items = [];
  const old = analysis.old;
  if (analysis.excluded.length) {
    items.push(`Tidak dibandingkan: ${analysis.excluded.map(o => o.preset.name).join(", ")} (${analysis.excluded.some(o => o.flags.sameBank) ? "bank sama dengan KPR lama = bukan take-over; pakai sebagai bahan negosiasi repricing" : "melebihi batas LTV"}).`);
  }
  const best = analysis.ranked.optimal[0]?.optimal;
  if (best) {
    items.push(`Eksposur floating: KPR lama floating ${old.floatMonths} bln mulai saldo ${jt(old.floatStartBalance)}; opsi optimal teratas floating ${best.floatMonths} bln mulai saldo ${jt(best.floatStartBalance)}.`);
  }
  items.push("Opsi Ringan hampir selalu lebih mahal secara nominal; pilih hanya jika butuh ruang cashflow.");
  items.push("Keuntungan Cepat/Optimal sebagian berasal dari melunasi lebih cepat; lihat baris \"Untung murni pindah bank\".");
  items.push("Persetujuan bank baru bergantung pada SLIK, DSR, usia saat lunas, dan appraisal ulang.");
  return ["### ⚠️ Risiko & catatan", ...items.map(i => `- ${i}`)].join("\n");
}

function nextSteps(analysis) {
  const steps = [
    "Cek perjanjian kredit (PK): klausul penalti pelunasan & tahapan bunga.",
    "Minta penawaran tertulis (SPPK) take-over dari 2–3 bank teratas, termasuk bunga setelah masa fixed.",
    "Masukkan angka SPPK itu ke kalkulator ini (preset bisa diedit) lalu tanya ulang AI."
  ];
  if (analysis.verdict.type === "wait") steps.unshift(`Ajukan penawaran sekitar 2–3 bulan sebelum ${analysis.timing.label} agar proses selesai sebelum bunga naik.`);
  return ["### ✅ Langkah berikutnya", ...steps.map(s => `- [ ] ${s}`)].join("\n");
}

/** Full advisor report shown when no Gemini key is set (and used as the reference for Gemini). */
export function buildLocalReport(analysis) {
  if (!analysis) return "Data KPR lama belum lengkap: isi sisa pokok dan sisa tenor terlebih dahulu.";
  const top = (key, n) => analysis.ranked[key].filter(o => o[key]).slice(0, n);
  const sections = [
    "### 🎯 Kesimpulan",
    verdictText(analysis),
    oldLoanSection(analysis),
    definitions(analysis),
    `### ${CASES.optimal.icon} ${CASES.optimal.label}: 3 teratas`,
    ...top("optimal", 3).map((o, i) => optionBlock(analysis, o, "optimal", i + 1)),
    `### ${CASES.cepat.icon} ${CASES.cepat.label}`,
    compactTable(analysis, "cepat", 5),
    `### ${CASES.ringan.icon} ${CASES.ringan.label}`,
    compactTable(analysis, "ringan", 5),
    `### ⚖️ Pembanding: tenor sama`,
    `_${SAME_TENOR_RULE}._`,
    compactTable(analysis, "sameTenor", 5),
    timingSection(analysis),
    sensitivitySection(analysis),
    assumptionsSection(analysis),
    risksSection(analysis),
    nextSteps(analysis)
  ];
  return sections.filter(Boolean).join("\n\n");
}

/** Data block for Gemini: the reference report plus every option in full detail. */
export function buildAdvisorContext(analysis, { currentConfig } = {}) {
  if (!analysis) return "DATA KPR LAMA BELUM LENGKAP.";
  const allOptions = analysis.options.map(o => {
    const blocks = ["cepat", "optimal", "ringan", "sameTenor"]
      .filter(k => o[k])
      .map(k => optionBlock(analysis, o, k).replace(/^\*\*/, `**[${k === "sameTenor" ? "Tenor sama" : CASES[k].label}] `));
    const flags = [
      o.flags.sameBank && "BANK SAMA (bukan take-over)",
      o.flags.notInDocs && "tidak ada di docs",
      o.flags.tenorClamped && "tenor sama disesuaikan ke batas bank",
      !o.sameTenor.ltvOk && "melebihi LTV"
    ].filter(Boolean);
    return [`#### ${o.preset.name}${flags.length ? ` [${flags.join("; ")}]` : ""}`, ...blocks].join("\n");
  });
  return [
    `TANGGAL ANALISIS: ${monthLabel(analysis.today, 1)}`,
    "=== LAPORAN REFERENSI SISTEM (angka sudah dihitung & benar) ===",
    buildLocalReport(analysis),
    "=== DETAIL SEMUA OPSI (gunakan untuk pertanyaan lanjutan) ===",
    ...allOptions,
    currentConfig ? `=== KONFIGURASI BANK BARU DI KALKULATOR SAAT INI ===\n${currentConfig}` : null
  ].filter(Boolean).join("\n\n");
}
