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

/** Detail block for one plan: tenor & payoff month, rate and installment per stage, results and caveats. */
function planBlock(analysis, preset, plan, { rank, title } = {}) {
  const lines = [
    `**${rank ? `${rank}. ` : ""}${title || preset.name}** (${preset.bank})`,
    `- Tenor: **${tenorText(plan.tenorMonths, analysis.today, plan.offset || 0)}**${plan.offset ? ` (mulai ${monthLabel(analysis.today, plan.offset + 1)})` : ""}`,
    `- Skema ${SCHEME_LABELS[preset.scheme].toLowerCase()} & cicilan: ${planStages(preset, plan).join(" · ")}`,
    `- Hemat total ${sjt(plan.saving)} · NPV ${sjt(plan.npv)}${plan.offset ? " (dihitung ke hari ini)" : ""} · Balik modal: ${breakEvenText(plan)}`
  ];
  if (plan.switchGain !== null && plan.switchGain !== undefined) {
    lines.push(`- Untung murni pindah bank (vs tetap di bank lama + prepay ke tenor sama): ${sjt(plan.switchGain)}`);
  }
  if (plan.withinCap === false) lines.push(`- ⚠️ Cicilan tertinggi ${jt(plan.peak, 2)} melebihi batas ${jt(analysis.assumptions.installmentCap, 2)}`);
  if (plan.saving < 0) lines.push(`- ⚠️ Total bayar lebih mahal ${jt(-plan.saving)} dibanding bertahan`);
  const notes = [...(preset.notes || [])];
  if (preset.notInDocs) notes.unshift("Produk ini tidak tercantum di docs riset; parameternya belum terverifikasi.");
  if (notes.length) lines.push(`- Catatan: ${notes.join(" ")}`);
  return lines.join("\n");
}

const optionBlock = (analysis, o, key, rank) => planBlock(analysis, o.preset, o[key], { rank });

const yearsText = (months) => `${nf2.format(months / 12).replace(/,00$/, "")} th`;

function compactTable(analysis, key, limit) {
  const rows = analysis.ranked[key].slice(0, limit);
  if (!rows.length) return "_Tidak ada opsi._";
  const clamped = key === "sameTenor" && rows.some(o => o.flags.tenorClamped);
  const lines = [
    "| Opsi | Tenor | Cicilan awal→puncak | Hemat / NPV |",
    "|---|---|---|---|",
    ...rows.map(o => {
      const e = o[key];
      const mark = key === "sameTenor" && o.flags.tenorClamped ? "*" : "";
      const warn = e.withinCap === false ? " ⚠️" : "";
      return `| ${o.preset.name} | ${yearsText(e.tenorMonths)}${mark} | ${nf2.format(e.first / 1e6)}→${nf2.format(e.peak / 1e6)} jt${warn} | ${sjt(e.saving)} / ${sjt(e.npv)} |`;
    })
  ];
  if (clamped) lines.push("", "_* Tenor disesuaikan ke batas minimum/maksimum bank, jadi tidak lunas bersamaan dengan KPR lama._");
  return lines.join("\n");
}

function verdictText(analysis) {
  const v = analysis.verdict;
  const a = analysis.assumptions;
  const name = (id) => analysis.options.find(o => o.preset.id === id)?.preset.name || id;
  switch (v.type) {
    case "none":
      return `**${v.title}.** Pilih bank KPR lama yang benar atau naikkan batas LTV/nilai properti agar produk lain bisa dibandingkan.`;
    case "cap":
      return `**${v.title}.** Tidak ada tenor di bank mana pun yang cicilan tertingginya ≤ ${jt(a.installmentCap, 2)}/bln. Cicilan tertinggi paling rendah yang bisa dicapai adalah ${jt(v.lowestPeak, 2)}/bln (tenor maksimum).${v.oldAboveCap ? ` KPR Anda sendiri pun mencapai ${jt(analysis.old.peak, 2)}/bln.` : ""} Naikkan batas cicilan atau kosongkan (0) agar memakai cicilan tertinggi KPR lama.`;
    case "stay":
      return `**${v.title}.** Tidak ada produk dengan rencana yang menguntungkan secara material (NPV > ${jt(a.materiality)}), hemat secara nominal, balik modal, dan lebih baik daripada tetap di bank lama + prepay${analysis.timing ? `, baik sekarang maupun menjelang ${analysis.timing.label}` : ""}.`;
    case "wait": {
      const t = analysis.timing;
      const now = v.nowPresetId
        ? `Pindah sekarang paling bagus ${sjt(v.nowNpv)} (${name(v.nowPresetId)}), karena Anda melepas sisa bulan berbunga ${pct(t.fromRate)}.`
        : "Pindah sekarang belum ada yang menguntungkan.";
      return `**${v.title}.** Bunga KPR Anda naik dari ${pct(t.fromRate)} ke ${pct(t.toRate)} mulai ${t.label}. Rencana terbaik: pindah ke **${name(v.presetId)}** tepat sebelum itu, tenor ${tenorText(v.tenorMonths, analysis.today, v.offset)}, NPV ${sjt(v.plan.npv)} (dihitung ke hari ini), hemat total ${sjt(v.plan.saving)}. ${now} Keyakinan: ${v.confidence}.`;
    }
    default:
      return `**${v.title}**, tenor ${tenorText(v.tenorMonths, analysis.today)}. NPV ${sjt(v.plan.npv)}, hemat total ${sjt(v.plan.saving)}. Keyakinan: ${v.confidence}.`;
  }
}

function recommendedPlanSection(analysis) {
  const v = analysis.verdict;
  if (!v.plan) return null;
  const preset = analysis.options.find(o => o.preset.id === v.presetId).preset;
  return [
    `### ⭐ Rencana yang direkomendasikan${v.type === "wait" ? ` (pindah ${monthLabel(analysis.today, v.offset + 1)})` : " (pindah sekarang)"}`,
    planBlock(analysis, preset, v.plan)
  ].join("\n\n");
}

function oldLoanSection(analysis) {
  const old = analysis.old;
  const stages = old.stages.map(s => `${s.from}–${s.to} ${s.stage === "Floating" ? "floating" : "fixed"} ${pct(s.rate)} → ${jt(s.payment, 2)}`);
  return [
    `### 🏠 KPR Anda saat ini${old.bank ? ` (${old.bank})` : ""}`,
    `- Sisa pokok ${jt(old.balance)} · sisa tenor ${tenorText(old.remainingMonths, analysis.today)}`,
    `- Skema & cicilan dari bulan ini: ${stages.join(" · ")}`,
    old.monthlyFee ? `- Biaya bulanan lain ${rp(old.monthlyFee)} (di luar cicilan di atas)` : null,
    `- Total sisa bayar ${jt(old.total)} (bunga ${jt(old.interest)})`
  ].filter(Boolean).join("\n");
}

function definitions(analysis) {
  const a = analysis.assumptions;
  const capSource = a.installmentCapSource === "user" ? "batas yang Anda isi" : "cicilan tertinggi KPR Anda saat ini, tanpa biaya bulanan lain";
  return [
    "### 📖 Cara membaca",
    `- ${CASES.cepat.icon} **${CASES.cepat.label}**: ${CASES.cepat.rule}.`,
    `- ${CASES.optimal.icon} **${CASES.optimal.label}**: ${CASES.optimal.rule}. Batas cicilan: **${jt(a.installmentCap, 2)}/bln** (${capSource}).`,
    `- ${CASES.ringan.icon} **${CASES.ringan.label}**: ${CASES.ringan.rule}.`,
    `- **NPV** = nilai hari ini dari selisih cicilan (discount rate ${plainPct(a.discountRate)}), dikurangi penalti. **Hemat total** = nominal, sudah termasuk penalti & biaya proses. **Balik modal** = bulan setelah akumulasi hemat tidak pernah negatif lagi.`
  ].join("\n");
}

function optimalSection(analysis) {
  const top = analysis.ranked.optimal.slice(0, 3);
  const parts = [`### ${CASES.optimal.icon} ${CASES.optimal.label} (pindah sekarang): ${top.length ? `${top.length} teratas` : "tidak ada"}`];
  top.forEach((o, i) => parts.push(optionBlock(analysis, o, "optimal", i + 1)));
  const byReason = (reason) => analysis.noOptimal.filter(o => o.optimalReason === reason).map(o => o.preset.name);
  const unprofitable = byReason("unprofitable");
  const cap = byReason("cap");
  if (unprofitable.length) parts.push(`_Tidak ada tenor yang menguntungkan: ${unprofitable.join(", ")}._`);
  if (cap.length) parts.push(`_Tidak ada tenor dengan cicilan ≤ batas: ${cap.join(", ")}._`);
  return parts.join("\n\n");
}

function assumptionsSection(analysis) {
  const a = analysis.assumptions;
  return [
    "### 🧾 Asumsi",
    `- Penalti pelunasan bank lama ${plainPct(a.penaltyPct)} = **${jt(analysis.old.balance * a.penaltyPct / 100)} dibayar tunai** saat pindah (cek klausul di perjanjian kredit).`,
    `- Biaya proses dibiayai ke pinjaman baru: provisi & admin sesuai bank, notaris ${rp(a.notaryFee)}, appraisal ${rp(a.appraisalFee)}, asuransi ${rp(a.insuranceFee)}.`,
    "- Suku bunga & tahapan bank baru dari preset riset (docs); promo bisa berubah, minta penawaran tertulis (SPPK) sebelum memutuskan.",
    "- Bank menghitung ulang cicilan dari sisa pokok & sisa tenor setiap ganti tahap bunga (anuitas)."
  ].join("\n");
}

function timingSection(analysis) {
  const t = analysis.timing;
  if (!t || !t.options.length) return null;
  const rows = t.options.slice(0, 5).map(x => {
    const o = analysis.options.find(op => op.preset.id === x.id);
    return `| ${o.preset.name} | ${o.optimal ? `${sjt(o.optimal.npv)} (${yearsText(o.optimal.tenorMonths)})` : "—"} | ${sjt(x.npv)} (${yearsText(x.tenorMonths)}) |`;
  });
  return [
    "### ⏱️ Kapan sebaiknya pindah?",
    `Bunga KPR Anda naik ${pct(t.fromRate)} → ${pct(t.toRate)} mulai **${t.label}**. NPV rencana optimal yang menguntungkan, dihitung ke hari ini:`,
    "",
    `| Opsi | Pindah sekarang | Pindah ${t.label} |`,
    "|---|---|---|",
    ...rows,
    "",
    "_Asumsi: promo bank masih sama saat itu (tidak dijamin)._"
  ].join("\n");
}

function sensitivitySection(analysis) {
  if (!analysis.sensitivity.some(s => s.top.length)) return null;
  const name = (id) => analysis.options.find(o => o.preset.id === id)?.preset.name || id;
  const basis = analysis.sensitivityBasis === "later" ? `rencana pindah ${analysis.timing.label}` : "rencana Optimal pindah sekarang";
  return [
    `### 🔬 Uji sensitivitas (${basis})`,
    ...analysis.sensitivity.map(s => `- ${s.label}: ${s.top.map(t => `${name(t.id)} ${sjt(t.npv)}`).join(", ") || "tidak ada opsi"}`)
  ].join("\n");
}

function risksSection(analysis) {
  const items = [];
  const old = analysis.old;
  const sameBank = analysis.excluded.filter(o => o.flags.sameBank).map(o => o.preset.name);
  const overLtv = analysis.excluded.filter(o => !o.flags.sameBank && !o.sameTenor.ltvOk).map(o => o.preset.name);
  if (sameBank.length) items.push(`Tidak dibandingkan (bank sama dengan KPR lama = bukan take-over; pakai sebagai bahan negosiasi repricing): ${sameBank.join(", ")}.`);
  if (overLtv.length) items.push(`Tidak dibandingkan (pinjaman baru melebihi batas LTV ${jt(analysis.assumptions.maxLoan)}): ${overLtv.join(", ")}.`);
  const plan = analysis.verdict.plan || analysis.ranked.optimal[0]?.optimal;
  if (plan) {
    items.push(`Eksposur floating: KPR lama floating ${old.floatMonths} bln mulai saldo ${jt(old.floatStartBalance)}; rencana teratas floating ${plan.floatMonths} bln mulai saldo ${jt(plan.floatStartBalance)}.`);
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
    "Isi angka SPPK di kartu KPR Bank Baru (pilih preset bank, lalu edit bunga/biaya), lalu tanya ulang AI: penawaran Anda ikut dibandingkan."
  ];
  if (analysis.verdict.type === "wait") steps.unshift(`Ajukan penawaran sekitar 2–3 bulan sebelum ${analysis.timing.label} agar proses selesai sebelum bunga naik.`);
  return ["### ✅ Langkah berikutnya", ...steps.map(s => `- [ ] ${s}`)].join("\n");
}

/** Full advisor report shown when no Gemini key is set (and used as the reference for Gemini). */
export function buildLocalReport(analysis) {
  if (!analysis) return "Data KPR lama belum lengkap: isi sisa pokok dan sisa tenor terlebih dahulu.";
  const hasOptions = analysis.ranked.cepat.length > 0;
  const sections = [
    "### 🎯 Kesimpulan",
    verdictText(analysis),
    recommendedPlanSection(analysis),
    oldLoanSection(analysis),
    definitions(analysis),
    hasOptions ? optimalSection(analysis) : null,
    hasOptions ? `### ${CASES.cepat.icon} ${CASES.cepat.label}\n\n${compactTable(analysis, "cepat", 5)}` : null,
    hasOptions ? `### ${CASES.ringan.icon} ${CASES.ringan.label}\n\n${compactTable(analysis, "ringan", 5)}` : null,
    hasOptions ? `### ⚖️ Pembanding: tenor sama\n\n_${SAME_TENOR_RULE}._\n\n${compactTable(analysis, "sameTenor", 5)}` : null,
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
  const label = { cepat: CASES.cepat.label, optimal: CASES.optimal.label, ringan: CASES.ringan.label, sameTenor: "Tenor sama" };
  const allOptions = analysis.options.map(o => {
    const blocks = ["cepat", "optimal", "ringan", "sameTenor"]
      .filter(k => o[k])
      .map(k => planBlock(analysis, o.preset, o[k], { title: `[${label[k]}] ${o.preset.name}` }));
    if (!o.optimal) blocks.push(`- [${label.optimal}] tidak ada: ${o.optimalReason === "cap" ? "tidak ada tenor dengan cicilan ≤ batas" : "tidak ada tenor yang menguntungkan"}`);
    const later = analysis.timing?.options.find(t => t.id === o.preset.id);
    if (later) blocks.push(planBlock(analysis, o.preset, later, { title: `[Optimal, pindah ${analysis.timing.label}] ${o.preset.name}` }));
    const flags = [
      o.flags.sameBank && "BANK SAMA (bukan take-over)",
      o.flags.notInDocs && "tidak ada di docs",
      o.flags.custom && "PENAWARAN DARI ANGKA PENGGUNA",
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
