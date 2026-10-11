// Refinance analysis behind the AI advisor: compares the current loan with every bank preset under three
// strategies, checks refinance timing and sensitivity, and derives a deterministic verdict. Gemini only
// explains these numbers; it never computes them.
import { schedule } from "../mortgage.js";
import { bankPresets } from "../../constants/bankPresets.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const TIMING_WINDOW_MONTHS = 36;

// Three strategies per bank, plus a same-tenor reference used only to judge whether switching itself pays.
export const CASES = {
  cepat: { label: "Cepat", icon: "⚡", rule: "tenor minimum yang diizinkan bank (lunas paling cepat), berapa pun cicilannya" },
  optimal: { label: "Optimal", icon: "🎯", rule: "tenor (per tahun, dalam batas bank) dengan NPV tertinggi yang cicilan tertingginya tidak melebihi batas cicilan" },
  ringan: { label: "Ringan", icon: "🛡️", rule: "tenor maksimum yang diizinkan bank (cicilan paling ringan)" }
};
export const SAME_TENOR_RULE = "tenor sama dengan sisa tenor KPR lama (lunas di bulan yang sama): pembanding apple-to-apple, bukan rekomendasi";

/** Calendar label for the n-th installment counted from the current month (n = 1 → this month). */
export function monthLabel(today, n) {
  const d = new Date(today.getFullYear(), today.getMonth() + n - 1, 1);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

const peakOf = (rows) => rows.reduce((m, r) => Math.max(m, r.payment), 0);
const pctLabel = (x) => `${String(+x.toFixed(2)).replace(".", ",")}%`;

/**
 * Discounted comparison of keeping the old loan vs switching after `offset` old installments.
 * breakEven is the month after which cumulative savings never turn negative again (null if they end negative);
 * firstBreakEven is the first month cumulative savings reach zero, which can be misleading on its own.
 */
function cashflow(oldRows, newRows, penalty, discountRate, offset = 0) {
  const r = discountRate / 1200;
  let cum = -penalty;
  let npv = -penalty / Math.pow(1 + r, offset);
  let firstBreakEven = null;
  let lastNegative = 0;
  const n = Math.max(oldRows.length - offset, newRows.length);
  for (let i = 0; i < n; i++) {
    const diff = (oldRows[offset + i]?.payment || 0) - (newRows[i]?.payment || 0);
    cum += diff;
    npv += diff / Math.pow(1 + r, offset + i + 1);
    if (firstBreakEven === null && cum >= 0) firstBreakEven = i + 1;
    if (cum < 0) lastNegative = i + 1;
  }
  return { npv, saving: cum, firstBreakEven, breakEven: cum >= 0 ? lastNegative + 1 : null };
}

function evaluateOption(ctx, preset, tenorMonths, offset = 0) {
  const balance = offset === 0 ? ctx.balance : ctx.oldRows[offset - 1].balance;
  const fees = (preset.adminFee || 0) + balance * (preset.provisionPct || 0) / 100
    + ctx.notaryFee + ctx.appraisalFee + ctx.insuranceFee;
  const penalty = balance * ctx.penaltyPct / 100;
  const principal = balance + fees;
  const s = schedule(principal, tenorMonths / 12, preset.scheme, preset.cfg);
  const floatIdx = s.rows.findIndex(r => r.stageKey === "floating");
  return {
    tenorMonths,
    balance,
    fees,
    penalty,
    principal,
    first: s.rows[0]?.payment || 0,
    peak: peakOf(s.rows),
    total: s.totalPayment,
    interest: s.totalInterest,
    floatMonths: floatIdx < 0 ? 0 : s.rows.length - floatIdx,
    floatStartBalance: floatIdx < 0 ? 0 : floatIdx === 0 ? principal : s.rows[floatIdx - 1].balance,
    ltvOk: principal <= ctx.maxLoan,
    ...cashflow(ctx.oldRows, s.rows, penalty, ctx.discountRate, offset)
  };
}

/**
 * "Stay but pay faster": the old loan re-amortized over a shorter tenor, paying the old bank's penalty on the
 * extra principal. Separates the gain of switching banks from the gain of simply paying the debt off sooner.
 */
function stayFaster(ctx, tenorMonths) {
  if (tenorMonths >= ctx.oldRows.length) return null;
  const { balance, scheme, cfg } = ctx.oldInput;
  const fast = schedule(balance, tenorMonths / 12, scheme, cfg, ctx.oldMonthlyFee);
  const r = ctx.discountRate / 1200;
  let npv = 0;
  let saving = 0;
  ctx.oldRows.forEach((o, i) => {
    const f = fast.rows[i];
    const extraPrincipal = Math.max(0, (f?.principalPaid || 0) - o.principalPaid);
    const diff = o.payment - ((f?.payment || 0) + extraPrincipal * ctx.penaltyPct / 100);
    saving += diff;
    npv += diff / Math.pow(1 + r, i + 1);
  });
  return { npv, saving, first: fast.rows[0]?.payment || 0, peak: peakOf(fast.rows) };
}

const withinCap = (ctx, option) => option.peak <= ctx.installmentCap + 0.5;

/** Adds the "stay with the old bank and prepay to the same tenor" benchmark to an option. */
function withStayBenchmark(ctx, option) {
  const stay = stayFaster(ctx, option.tenorMonths);
  return { ...option, withinCap: withinCap(ctx, option), stayFaster: stay, switchGain: stay ? option.npv - stay.npv : null };
}

/**
 * Optimal = the whole-year tenor (within the bank's limits) with the highest NPV whose highest installment stays
 * within the installment cap. With loan rates above the discount rate this is usually the shortest affordable
 * tenor, but the search makes no such assumption.
 */
function pickOptimal(ctx, preset, offset = 0) {
  let best = null;
  for (let years = preset.minTenor; years <= preset.maxTenor; years++) {
    const option = evaluateOption(ctx, preset, years * 12, offset);
    if (withinCap(ctx, option) && (!best || option.npv > best.npv)) best = option;
  }
  return best;
}

function clampTenor(months, preset) {
  return Math.min(Math.max(months, preset.minTenor * 12), preset.maxTenor * 12);
}

/** Groups the remaining old schedule into its rate stages (from this month on). */
function oldStages(rows, today) {
  const stages = [];
  rows.forEach((r, i) => {
    const last = stages[stages.length - 1];
    if (last && last.rate === r.rate && last.stage === r.stage) {
      last.endMonth = i + 1;
    } else {
      stages.push({ stage: r.stage, rate: r.rate, payment: r.payment, startMonth: i + 1, endMonth: i + 1 });
    }
  });
  return stages.map(s => ({ ...s, from: monthLabel(today, s.startMonth), to: monthLabel(today, s.endMonth) }));
}

/** First upcoming installment (within the timing window) at which the old loan's rate goes up. */
function nextRateIncrease(rows) {
  for (let i = 1; i < Math.min(rows.length, TIMING_WINDOW_MONTHS + 1); i++) {
    if (rows[i].rate > rows[i - 1].rate) return { offset: i, fromRate: rows[i - 1].rate, toRate: rows[i].rate };
  }
  return null;
}

function rankBy(options, key) {
  return [...options].sort((a, b) => b[key].npv - a[key].npv);
}

const presetFlags = (preset, oldBank) => ({
  sameBank: Boolean(oldBank) && preset.bank === oldBank,
  notInDocs: Boolean(preset.notInDocs)
});

/**
 * @param {object} p
 * @param {object} p.state  calculator state (fees, penalty, discount rate, LTV, property value, old bank)
 * @param {object} p.result calculator result (result.old schedule and result.oldInput)
 * @param {Date}   [p.today]
 */
export function analyzeRefinance({ state, result, today = new Date(), presets = bankPresets }) {
  const oldRows = result.old.rows;
  if (!oldRows.length) return null;

  const oldMonthlyFee = state.oldMonthlyFee || 0;
  const oldPeakExFee = peakOf(oldRows) - oldMonthlyFee;
  const ctx = {
    oldInput: result.oldInput,
    oldRows,
    oldMonthlyFee,
    oldPeakExFee,
    // Affordability limit for the "optimal" search: the user's own budget, else the old loan's highest installment.
    installmentCap: state.installmentCap > 0 ? state.installmentCap : oldPeakExFee,
    installmentCapSource: state.installmentCap > 0 ? "user" : "oldPeak",
    balance: result.oldInput.balance,
    penaltyPct: state.penalty || 0,
    discountRate: state.discountRate || 0,
    notaryFee: state.notaryFee || 0,
    appraisalFee: state.appraisalFee || 0,
    insuranceFee: state.insuranceFee || 0,
    maxLoan: (state.propertyValue || 0) * (state.ltv || 0) / 100
  };
  const remainingMonths = oldRows.length;
  const materiality = Math.max(2_000_000, ctx.balance * 0.005);

  const options = presets.map(preset => {
    const sameMonths = clampTenor(remainingMonths, preset);
    const optimal = pickOptimal(ctx, preset);
    return {
      preset,
      flags: { ...presetFlags(preset, state.oldBank), tenorClamped: sameMonths !== remainingMonths },
      cepat: withStayBenchmark(ctx, evaluateOption(ctx, preset, preset.minTenor * 12)),
      optimal: optimal && withStayBenchmark(ctx, optimal),
      ringan: withStayBenchmark(ctx, evaluateOption(ctx, preset, preset.maxTenor * 12)),
      sameTenor: evaluateOption(ctx, preset, sameMonths)
    };
  });
  const eligible = options.filter(o => !o.flags.sameBank && o.sameTenor.ltvOk);

  // Refinance timing: the optimal plan now vs the optimal plan started right before the old loan's next rate increase.
  const increase = nextRateIncrease(oldRows);
  const timing = increase && {
    ...increase,
    month: increase.offset + 1,
    label: monthLabel(today, increase.offset + 1),
    options: options.map(o => {
      const later = pickOptimal(ctx, o.preset, increase.offset);
      return later && {
        id: o.preset.id,
        tenorMonths: later.tenorMonths,
        npvToday: later.npv,
        saving: later.saving,
        gainVsNow: o.optimal ? later.npv - o.optimal.npv : null
      };
    }).filter(Boolean)
  };

  // Sensitivity of the optimal-plan ranking (tenors held fixed).
  const scenarios = [
    { label: "Floating bank baru +1%", floatShift: 1 },
    { label: "Floating bank baru −1%", floatShift: -1 },
    { label: `Discount rate ${pctLabel(Math.max(0, ctx.discountRate - 2))}`, discountRate: Math.max(0, ctx.discountRate - 2) },
    { label: `Discount rate ${pctLabel(ctx.discountRate + 2)}`, discountRate: ctx.discountRate + 2 },
    ...(ctx.penaltyPct >= 1 ? [{ label: `Penalti ${pctLabel(ctx.penaltyPct - 0.5)}`, penaltyPct: ctx.penaltyPct - 0.5 }] : [])
  ];
  const sensitivity = scenarios.map(sc => {
    const sctx = { ...ctx, discountRate: sc.discountRate ?? ctx.discountRate, penaltyPct: sc.penaltyPct ?? ctx.penaltyPct };
    const ranked = eligible.filter(o => o.optimal).map(o => {
      const preset = sc.floatShift && o.preset.scheme !== "full"
        ? { ...o.preset, cfg: { ...o.preset.cfg, floatingRate: (o.preset.cfg.floatingRate || 0) + sc.floatShift } }
        : o.preset;
      return { id: o.preset.id, npv: evaluateOption(sctx, preset, o.optimal.tenorMonths).npv };
    }).sort((a, b) => b.npv - a.npv);
    return { label: sc.label, top: ranked.slice(0, 3), positive: ranked.filter(x => x.npv > 0).length };
  });

  // Verdict. A bank qualifies when its optimal plan gains materially in NPV, ends ahead in nominal terms, and
  // beats simply staying with the old bank and prepaying to the same tenor.
  const rankedOptimal = [...eligible].filter(o => o.optimal).sort((a, b) => b.optimal.npv - a.optimal.npv);
  const candidates = rankedOptimal.filter(o => o.optimal.npv > materiality && o.optimal.saving > 0
    && o.optimal.breakEven !== null && (o.optimal.switchGain === null || o.optimal.switchGain > 0)
    && o.sameTenor.npv > 0);
  const best = candidates[0] || null;
  const bestLater = timing && candidates.length
    ? candidates
        .map(o => ({ o, t: timing.options.find(t => t.id === o.preset.id) }))
        .filter(x => x.t)
        .sort((a, b) => b.t.npvToday - a.t.npvToday)[0]
    : null;
  const stableTop = best && sensitivity.every(s => s.top[0]?.id === best.preset.id);
  const margin = best && candidates[1] ? best.optimal.npv - candidates[1].optimal.npv : null;

  let verdict;
  if (!best) {
    verdict = { type: "stay", title: "Pertahankan KPR lama" };
  } else if (bestLater && bestLater.t.npvToday - best.optimal.npv > materiality) {
    verdict = {
      type: "wait",
      title: `Belum sekarang: siapkan refinance menjelang ${timing.label}`,
      presetId: bestLater.o.preset.id,
      tenorMonths: bestLater.t.tenorMonths
    };
  } else {
    verdict = { type: "switch", title: `Refinance layak: ${best.preset.name}`, presetId: best.preset.id, tenorMonths: best.optimal.tenorMonths };
  }
  verdict.confidence = best && stableTop && (margin === null || margin > materiality) ? "tinggi" : "sedang";

  // Best plan per strategy (the one-click "apply" buttons in the chat).
  const pick = (o, key) => o && { presetId: o.preset.id, ...o[key] };
  const picks = {
    cepat: pick([...eligible]
      .filter(o => o.cepat.saving > 0 && (o.cepat.switchGain === null || o.cepat.switchGain > 0))
      .sort((a, b) => b.cepat.npv - a.cepat.npv)[0], "cepat"),
    optimal: pick(best || rankedOptimal[0], "optimal"),
    ringan: pick(rankBy(eligible, "ringan")[0], "ringan")
  };

  const oldFloatIdx = oldRows.findIndex(r => r.stageKey === "floating");
  return {
    today,
    assumptions: {
      penaltyPct: ctx.penaltyPct,
      installmentCap: ctx.installmentCap,
      installmentCapSource: ctx.installmentCapSource,
      discountRate: ctx.discountRate,
      notaryFee: ctx.notaryFee,
      appraisalFee: ctx.appraisalFee,
      insuranceFee: ctx.insuranceFee,
      maxLoan: ctx.maxLoan,
      materiality
    },
    old: {
      bank: state.oldBank || null,
      balance: ctx.balance,
      remainingMonths,
      payoff: monthLabel(today, remainingMonths),
      first: oldRows[0].payment,
      peak: ctx.oldPeakExFee,
      monthlyFee: oldMonthlyFee,
      total: result.old.totalPayment,
      interest: result.old.totalInterest,
      stages: oldStages(oldRows, today),
      floatMonths: oldFloatIdx < 0 ? 0 : oldRows.length - oldFloatIdx,
      floatStartBalance: oldFloatIdx < 0 ? 0 : oldFloatIdx === 0 ? ctx.balance : oldRows[oldFloatIdx - 1].balance
    },
    options,
    ranked: {
      optimal: rankedOptimal,
      cepat: rankBy(eligible, "cepat"),
      ringan: rankBy(eligible, "ringan"),
      sameTenor: rankBy(eligible, "sameTenor")
    },
    excluded: options.filter(o => !eligible.includes(o)),
    timing,
    sensitivity,
    verdict,
    picks
  };
}
