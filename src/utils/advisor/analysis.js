// Refinance analysis behind the AI advisor: compares the current loan with every bank preset under three
// strategies, checks refinance timing and sensitivity, and derives a deterministic verdict. Gemini only
// explains these numbers; it never computes them.
import { schedule, shiftScheme } from "../mortgage.js";
import { bankPresets } from "../../constants/bankPresets.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const TIMING_WINDOW_MONTHS = 36;

// Three strategies per bank, plus a same-tenor reference used only to judge whether switching itself pays.
export const CASES = {
  cepat: { label: "Cepat", icon: "⚡", rule: "tenor minimum yang diizinkan bank (lunas paling cepat), berapa pun cicilannya" },
  optimal: { label: "Optimal", icon: "🎯", rule: "tenor (per tahun, dalam batas bank) dengan NPV tertinggi di antara tenor yang cicilan tertingginya tidak melebihi batas cicilan dan benar-benar menguntungkan (hemat nominal, balik modal, dan lebih baik daripada tetap di bank lama + prepay)" },
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
  // Months in which the new installment is above what the old loan would charge in that same month.
  const monthsHigher = s.rows.filter((r, i) => {
    const o = ctx.oldRows[offset + i];
    return o && r.payment > o.payment - ctx.oldMonthlyFee + 0.5;
  }).length;
  return {
    tenorMonths,
    offset,
    balance,
    fees,
    penalty,
    principal,
    first: s.rows[0]?.payment || 0,
    peak: peakOf(s.rows),
    total: s.totalPayment,
    interest: s.totalInterest,
    oldFirst: (ctx.oldRows[offset]?.payment || 0) - ctx.oldMonthlyFee,
    monthsHigher,
    floatMonths: floatIdx < 0 ? 0 : s.rows.length - floatIdx,
    floatStartBalance: floatIdx < 0 ? 0 : floatIdx === 0 ? principal : s.rows[floatIdx - 1].balance,
    ltvOk: principal <= ctx.maxLoan,
    ...cashflow(ctx.oldRows, s.rows, penalty, ctx.discountRate, offset)
  };
}

/**
 * "Stay but pay faster": the old loan (from `offset` on) re-amortized over a shorter tenor, paying the old bank's
 * penalty on the extra principal. Separates the gain of switching banks from the gain of paying off sooner.
 */
function stayFaster(ctx, tenorMonths, offset = 0) {
  if (tenorMonths >= ctx.oldRows.length - offset) return null;
  const balance = offset === 0 ? ctx.balance : ctx.oldRows[offset - 1].balance;
  const { scheme, cfg } = ctx.oldInput;
  const fast = schedule(balance, tenorMonths / 12, scheme, shiftScheme(scheme, cfg, offset), ctx.oldMonthlyFee);
  const r = ctx.discountRate / 1200;
  let npv = 0;
  let saving = 0;
  ctx.oldRows.slice(offset).forEach((o, i) => {
    const f = fast.rows[i];
    const extraPrincipal = Math.max(0, (f?.principalPaid || 0) - o.principalPaid);
    const diff = o.payment - ((f?.payment || 0) + extraPrincipal * ctx.penaltyPct / 100);
    saving += diff;
    npv += diff / Math.pow(1 + r, offset + i + 1);
  });
  return { npv, saving, first: fast.rows[0]?.payment || 0, peak: peakOf(fast.rows) };
}

const withinCap = (ctx, option) => option.peak <= ctx.installmentCap + 0.5;

/** Adds the cap check and the "stay with the old bank and prepay to the same tenor" benchmark to an option. */
function withBenchmarks(ctx, option) {
  const stay = stayFaster(ctx, option.tenorMonths, option.offset);
  return { ...option, withinCap: withinCap(ctx, option), stayFaster: stay, switchGain: stay ? option.npv - stay.npv : null };
}

/**
 * A plan is worth recommending when it gains in present value, ends ahead in nominal terms, breaks even for good,
 * and beats simply staying with the old bank and prepaying to the same tenor (when that tenor is shorter).
 */
const profitable = (o) => o.npv > 0 && o.saving > 0 && o.breakEven !== null && (o.switchGain === null || o.switchGain > 0);

/**
 * Optimal = among the bank's whole-year tenors whose highest installment fits the cap and that are profitable,
 * the one with the highest NPV. `reason` says why there is none ("cap": no tenor fits the cap at all).
 */
function pickOptimal(ctx, preset, offset = 0) {
  let plan = null;
  let anyWithinCap = false;
  let anyWithinLtv = false;
  for (let years = preset.minTenor; years <= preset.maxTenor; years++) {
    const option = withBenchmarks(ctx, evaluateOption(ctx, preset, years * 12, offset));
    if (!option.withinCap) continue;
    anyWithinCap = true;
    if (!option.ltvOk) continue;
    anyWithinLtv = true;
    if (profitable(option) && (!plan || option.npv > plan.npv)) plan = option;
  }
  return { plan, reason: plan ? null : !anyWithinCap ? "cap" : !anyWithinLtv ? "ltv" : "unprofitable" };
}

function clampTenor(months, preset) {
  return Math.min(Math.max(months, preset.minTenor * 12), preset.maxTenor * 12);
}

/** Groups the remaining old schedule into its rate stages (from this month on); installments exclude the monthly fee. */
function oldStages(rows, today, monthlyFee) {
  const stages = [];
  rows.forEach((r, i) => {
    const last = stages[stages.length - 1];
    if (last && last.rate === r.rate && last.stage === r.stage) {
      last.endMonth = i + 1;
    } else {
      stages.push({ stage: r.stage, rate: r.rate, payment: r.payment - monthlyFee, startMonth: i + 1, endMonth: i + 1 });
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
  return [...options].filter(o => o[key]).sort((a, b) => b[key].npv - a[key].npv);
}

const presetFlags = (preset, oldBank) => ({
  sameBank: Boolean(oldBank) && preset.bank === oldBank,
  notInDocs: Boolean(preset.notInDocs),
  custom: Boolean(preset.custom)
});

const schemeKey = (scheme, cfg) => JSON.stringify(scheme === "step"
  ? [scheme, (cfg.steps || []).map(s => [+s.years, +s.rate]), +cfg.floatingRate]
  : scheme === "fixedFloating" ? [scheme, +cfg.fixedYears, +cfg.fixedRate, +cfg.floatingRate] : [scheme, +cfg.fullFixedRate]);

/**
 * The new-loan offer the user typed into the calculator on top of a bank preset (e.g. numbers from a written
 * SPPK). Returned as an extra option so the advisor compares it too; null when the preset is unchanged.
 */
export function customPlanFromState(state, presets = bankPresets) {
  const base = presets.find(p => p.id === state.newPresetId);
  if (!base || !state.newCfg) return null;
  const edited = schemeKey(state.newScheme, state.newCfg) !== schemeKey(base.scheme, base.cfg)
    || (state.provisionPct ?? base.provisionPct) !== base.provisionPct
    || (state.adminFee ?? base.adminFee) !== base.adminFee;
  if (!edited) return null;
  const years = state.newYears || base.defaultTenor;
  return {
    ...base,
    id: "custom",
    baseId: base.id,
    custom: true,
    name: `${base.name} (angka Anda)`,
    scheme: state.newScheme,
    cfg: state.newCfg,
    provisionPct: state.provisionPct ?? base.provisionPct,
    adminFee: state.adminFee ?? base.adminFee,
    minTenor: Math.min(base.minTenor, Math.max(1, Math.floor(years))),
    maxTenor: Math.max(base.maxTenor, Math.ceil(years)),
    notInDocs: false,
    notes: ["Penawaran yang Anda isi/edit di kalkulator (mis. dari SPPK); dibandingkan dengan aturan yang sama."]
  };
}

const SCENARIOS = (ctx) => [
  { label: "Floating (atau margin full fixed) bank baru +1%", floatShift: 1 },
  { label: "Floating (atau margin full fixed) bank baru −1%", floatShift: -1 },
  ...(ctx.discountRate >= 2 ? [{ label: `Discount rate ${pctLabel(ctx.discountRate - 2)}`, discountRate: ctx.discountRate - 2 }] : []),
  { label: `Discount rate ${pctLabel(ctx.discountRate + 2)}`, discountRate: ctx.discountRate + 2 },
  ...(ctx.penaltyPct >= 1 ? [{ label: `Penalti ${pctLabel(ctx.penaltyPct - 0.5)}`, penaltyPct: ctx.penaltyPct - 0.5 }] : [])
];

/** Re-ranks fixed plans ({ id, preset, tenorMonths, offset }) under each stress scenario. */
function stressTest(ctx, plans) {
  return SCENARIOS(ctx).map(sc => {
    const sctx = { ...ctx, discountRate: sc.discountRate ?? ctx.discountRate, penaltyPct: sc.penaltyPct ?? ctx.penaltyPct };
    const ranked = plans.map(p => {
      const key = p.preset.scheme === "full" ? "fullFixedRate" : "floatingRate";
      const preset = sc.floatShift
        ? { ...p.preset, cfg: { ...p.preset.cfg, [key]: (p.preset.cfg[key] || 0) + sc.floatShift } }
        : p.preset;
      return { id: p.id, npv: evaluateOption(sctx, preset, p.tenorMonths, p.offset).npv };
    }).sort((a, b) => b.npv - a.npv);
    return { label: sc.label, top: ranked.slice(0, 3), positive: ranked.filter(x => x.npv > 0).length };
  });
}

/**
 * @param {object} p
 * @param {object} p.state  calculator state (fees, penalty, discount rate, LTV, property value, old bank, cap)
 * @param {object} p.result calculator result (result.old schedule and result.oldInput)
 * @param {Date}   [p.today]
 * @param {object} [p.customPlan] extra offer to compare, see customPlanFromState()
 */
export function analyzeRefinance({ state, result, today = new Date(), presets = bankPresets, customPlan = null }) {
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
  // The user's written offer supersedes the research preset it was entered on.
  const allPresets = customPlan ? [customPlan, ...presets.filter(p => p.id !== customPlan.baseId)] : presets;

  const options = allPresets.map(preset => {
    const sameMonths = clampTenor(remainingMonths, preset);
    const { plan, reason } = pickOptimal(ctx, preset);
    return {
      preset,
      flags: { ...presetFlags(preset, state.oldBank), tenorClamped: sameMonths !== remainingMonths },
      cepat: withBenchmarks(ctx, evaluateOption(ctx, preset, preset.minTenor * 12)),
      optimal: plan,
      optimalReason: reason,
      ringan: withBenchmarks(ctx, evaluateOption(ctx, preset, preset.maxTenor * 12)),
      sameTenor: evaluateOption(ctx, preset, sameMonths)
    };
  });
  const otherBanks = options.filter(o => !o.flags.sameBank);
  const isEligible = (o) => !o.flags.sameBank && o.sameTenor.ltvOk;
  const eligible = options.filter(isEligible);
  const byId = (id) => options.find(o => o.preset.id === id);

  // Refinance timing: the optimal plan started right before the old loan's next rate increase, valued today.
  const increase = nextRateIncrease(oldRows);
  const timing = increase && {
    ...increase,
    month: increase.offset + 1,
    label: monthLabel(today, increase.offset + 1),
    options: otherBanks
      .map(o => {
        const { plan } = pickOptimal(ctx, o.preset, increase.offset);
        return plan && { id: o.preset.id, ...plan, npvToday: plan.npv, gainVsNow: o.optimal ? plan.npv - o.optimal.npv : null };
      })
      .filter(Boolean)
      .sort((a, b) => b.npv - a.npv)
  };

  // Verdict: compare the best qualifying plan now with the best qualifying plan at the next rate increase.
  const rankedOptimal = rankBy(eligible, "optimal");
  const nowCandidates = rankedOptimal.filter(o => o.optimal.npv > materiality);
  const laterCandidates = (timing?.options || []).filter(t => t.npv > materiality);
  const bestNow = nowCandidates[0] || null;
  const bestLater = laterCandidates[0] || null;

  const oldAboveCap = oldPeakExFee > ctx.installmentCap + 0.5;
  let verdict;
  let basis = [];
  if (!eligible.length && !bestLater) {
    verdict = { type: "none", title: "Belum ada pembanding: semua produk dikecualikan (bank sama atau melebihi LTV)" };
  } else if (!bestNow && !bestLater) {
    // Only blame the cap when a plan would pay off without it; otherwise every product simply loses money.
    const uncapped = eligible.every(o => o.optimalReason === "cap")
      ? eligible
          .map(o => ({ o, plan: pickOptimal({ ...ctx, installmentCap: Infinity }, o.preset).plan }))
          .filter(x => x.plan)
          .sort((a, b) => b.plan.npv - a.plan.npv)[0] || null
      : null;
    verdict = uncapped
      ? {
          type: "cap",
          title: "Batas cicilan terlalu rendah untuk rencana yang menguntungkan",
          neededPeak: uncapped.plan.peak,
          neededPresetId: uncapped.o.preset.id,
          neededTenorMonths: uncapped.plan.tenorMonths,
          oldAboveCap
        }
      : { type: "stay", title: "Pertahankan KPR lama", oldAboveCap: ctx.installmentCapSource === "user" && oldAboveCap };
  } else if (bestLater && (!bestNow || bestLater.npv - bestNow.optimal.npv > materiality)) {
    verdict = {
      type: "wait",
      title: `Belum sekarang: siapkan refinance menjelang ${timing.label}`,
      presetId: bestLater.id,
      tenorMonths: bestLater.tenorMonths,
      offset: bestLater.offset,
      plan: bestLater,
      nowPresetId: bestNow?.preset.id || null,
      nowNpv: bestNow?.optimal.npv ?? null
    };
    basis = laterCandidates.map(t => ({ id: t.id, preset: byId(t.id).preset, tenorMonths: t.tenorMonths, offset: t.offset, npv: t.npv }));
    verdict.runnerUpNpv = laterCandidates[1]?.npv ?? null;
  } else {
    verdict = {
      type: "switch",
      title: `Refinance layak: ${bestNow.preset.name}`,
      presetId: bestNow.preset.id,
      tenorMonths: bestNow.optimal.tenorMonths,
      offset: 0,
      plan: bestNow.optimal
    };
    basis = nowCandidates.map(o => ({ id: o.preset.id, preset: o.preset, tenorMonths: o.optimal.tenorMonths, offset: 0, npv: o.optimal.npv }));
    verdict.runnerUpNpv = nowCandidates[1]?.optimal.npv ?? null;
  }

  // Stress-test the plans the verdict chose from (later plans for "wait", plans now otherwise).
  const stressPlans = basis.length
    ? basis
    : rankedOptimal.map(o => ({ id: o.preset.id, preset: o.preset, tenorMonths: o.optimal.tenorMonths, offset: 0 }));
  const sensitivity = stressTest(ctx, stressPlans);
  if (verdict.presetId) {
    const stable = sensitivity.every(s => s.top[0]?.id === verdict.presetId);
    const margin = verdict.runnerUpNpv === null ? Infinity : verdict.plan.npv - verdict.runnerUpNpv;
    // "Wait" must also keep beating the best switch-now plan in every stress scenario.
    let waitHolds = true;
    if (verdict.type === "wait" && bestNow) {
      const pair = [
        { id: "later", preset: byId(verdict.presetId).preset, tenorMonths: verdict.tenorMonths, offset: verdict.offset },
        { id: "now", preset: bestNow.preset, tenorMonths: bestNow.optimal.tenorMonths, offset: 0 }
      ];
      waitHolds = stressTest(ctx, pair).every(sc => {
        const npv = Object.fromEntries(sc.top.map(t => [t.id, t.npv]));
        return npv.later - npv.now > materiality;
      });
    }
    verdict.confidence = stable && margin > materiality && waitHolds ? "tinggi" : "sedang";
  }

  // Best plan per strategy for the one-click "apply" buttons (always switching now; the calculator models a switch today).
  const pickOf = (o, key) => o && { presetId: o.preset.id, ...o[key] };
  const picks = {
    cepat: pickOf(rankBy(eligible, "cepat").find(o => profitable(o.cepat)), "cepat"),
    optimal: pickOf(bestNow || rankedOptimal[0] || null, "optimal"),
    ringan: pickOf(rankBy(eligible, "ringan").find(o => o.ringan.npv > 0), "ringan")
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
      first: oldRows[0].payment - oldMonthlyFee,
      peak: oldPeakExFee,
      monthlyFee: oldMonthlyFee,
      total: result.old.totalPayment,
      interest: result.old.totalInterest,
      stages: oldStages(oldRows, today, oldMonthlyFee),
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
    noOptimal: eligible.filter(o => !o.optimal),
    ltvLater: timing ? otherBanks.filter(o => !o.sameTenor.ltvOk && timing.options.some(t => t.id === o.preset.id)) : [],
    excluded: options.filter(o => !isEligible(o)),
    timing,
    sensitivity,
    sensitivityBasis: verdict.type === "wait" ? "later" : "now",
    verdict,
    picks
  };
}
