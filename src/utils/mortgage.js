/**
 * Calculates the fixed monthly installment for a loan.
 * @param {number} balance - The outstanding loan balance.
 * @param {number} annualRate - The annual interest rate (e.g., 8.5 for 8.5%).
 * @param {number} months - The number of months remaining in the loan.
 * @returns {number} The monthly installment amount.
 */
export function installment(balance, annualRate, months) {
  if (!balance || !months) return 0;
  const r = annualRate / 1200;
  return r === 0 ? balance / months : balance * r / (1 - Math.pow(1 + r, -months));
}

export const SCHEME_LABELS = {
  step: "Fixed bertahap",
  fixedFloating: "Fixed lalu floating",
  full: "Fixed sampai akhir"
};

const tierMonths = (years) => Math.max(0, Math.round((years || 0) * 12));

/**
 * Lists the fixed tiers of a step-up scheme with their month ranges.
 * @param {object} cfg - Step scheme config: { steps: [{ years, rate }], floatingRate }.
 * @returns {Array<{ index: number, rate: number, startMonth: number, endMonth: number }>}
 */
export function stepTiers(cfg) {
  const tiers = [];
  let end = 0;
  (cfg.steps || []).forEach((s, index) => {
    const months = tierMonths(s.years);
    if (months <= 0) return;
    tiers.push({ index, rate: s.rate || 0, startMonth: end + 1, endMonth: end + months });
    end += months;
  });
  return tiers;
}

/**
 * Month in which the floating rate starts (Infinity when the scheme never floats).
 */
export function floatingStartMonth(type, cfg) {
  if (type === "step") {
    const tiers = stepTiers(cfg);
    return (tiers.length ? tiers[tiers.length - 1].endMonth : 0) + 1;
  }
  if (type === "fixedFloating") return tierMonths(cfg.fixedYears) + 1;
  return Infinity;
}

/**
 * Re-bases a scheme defined from the loan's first month so it starts after `elapsedMonths`
 * (e.g. a 3/3/4-year step-up loan that has run 4 years continues with 2 years of tier 2, then tier 3).
 */
export function shiftScheme(type, cfg, elapsedMonths) {
  if (elapsedMonths <= 0) return cfg;
  if (type === "step") {
    const steps = stepTiers(cfg)
      .filter(t => t.endMonth > elapsedMonths)
      .map(t => ({
        years: (t.endMonth - Math.max(t.startMonth - 1, elapsedMonths)) / 12,
        rate: t.rate,
        tierNo: cfg.steps[t.index].tierNo || t.index + 1
      }));
    return { ...cfg, steps };
  }
  if (type === "fixedFloating") {
    return { ...cfg, fixedYears: Math.max(0, tierMonths(cfg.fixedYears) - elapsedMonths) / 12 };
  }
  return cfg;
}

/**
 * Determines the rate stage active in a specific month.
 * @param {string} type - The scheme type ('step', 'fixedFloating', or 'full').
 * @param {number} month - The current month number (1-indexed).
 * @param {object} cfg - The configuration object for the chosen scheme.
 * @returns {{ key: string, label: string, rate: number }}
 */
export function stageAt(type, month, cfg) {
  if (type === "step") {
    const tier = stepTiers(cfg).find(t => month <= t.endMonth);
    return tier
      ? { key: `step-${tier.index}`, label: `Fixed tahap ${cfg.steps[tier.index].tierNo || tier.index + 1}`, rate: tier.rate }
      : { key: "floating", label: "Floating", rate: cfg.floatingRate || 0 };
  }
  if (type === "fixedFloating") {
    return month <= tierMonths(cfg.fixedYears)
      ? { key: "fixed", label: "Fixed", rate: cfg.fixedRate || 0 }
      : { key: "floating", label: "Floating", rate: cfg.floatingRate || 0 };
  }
  return { key: "fixed", label: "Fixed", rate: cfg.fullFixedRate || 0 };
}

/**
 * Determines the interest rate for a specific month based on the chosen scheme.
 */
export function rateAt(type, month, cfg) {
  return stageAt(type, month, cfg).rate;
}

/**
 * Formats a month range as years when it falls on whole years ("Th 1–3"), else as months.
 */
export function periodLabel(startMonth, endMonth) {
  if ((startMonth - 1) % 12 === 0 && endMonth % 12 === 0) {
    const a = (startMonth - 1) / 12 + 1;
    const b = endMonth / 12;
    return a === b ? `Th ${a}` : `Th ${a}–${b}`;
  }
  return startMonth === endMonth ? `Bln ${startMonth}` : `Bln ${startMonth}–${endMonth}`;
}

const startLabel = (month) => (month - 1) % 12 === 0 ? `Th ${(month - 1) / 12 + 1}` : `Bln ${month}`;

const fmtRate = (r) => `${(r || 0).toFixed(2)}%`;

/**
 * Human-readable summary of a scheme, e.g. "Th 1–3 4.50% → Th 4–6 7.75% → Floating 11.00% (mulai Th 7)".
 * @param {number} [tenorYears] - When given, tiers beyond the tenor are dropped.
 */
export function describeScheme(type, cfg, tenorYears) {
  const totalMonths = tenorYears ? tierMonths(tenorYears) : Infinity;
  const floatStart = floatingStartMonth(type, cfg);
  const floatingPart = floatStart <= totalMonths
    ? `Floating ${fmtRate(cfg.floatingRate)} (mulai ${startLabel(floatStart)})`
    : null;

  if (type === "step") {
    const tiers = stepTiers(cfg)
      .filter(t => t.startMonth <= totalMonths)
      .map(t => `${periodLabel(t.startMonth, Math.min(t.endMonth, totalMonths))} ${fmtRate(t.rate)}`);
    return [...tiers, floatingPart].filter(Boolean).join(" → ");
  }
  if (type === "fixedFloating") {
    const fixedEnd = Math.min(tierMonths(cfg.fixedYears), totalMonths);
    const fixedPart = fixedEnd > 0 ? `Fixed ${periodLabel(1, fixedEnd)} ${fmtRate(cfg.fixedRate)}` : null;
    return [fixedPart, floatingPart].filter(Boolean).join(" → ");
  }
  return `Fixed ${fmtRate(cfg.fullFixedRate)} sampai lunas`;
}

/**
 * Generates an amortization schedule for a loan.
 * The installment is re-amortized over the remaining balance and tenor whenever the rate changes.
 * @param {number} principal - The initial loan principal.
 * @param {number} years - The loan duration in years.
 * @param {string} type - The scheme type.
 * @param {object} cfg - The configuration object.
 * @param {number} monthlyFee - Additional monthly administrative fee (default 0).
 * @returns {object} { rows, totalInterest, totalPayment }
 */
export function schedule(principal, years, type, cfg, monthlyFee = 0) {
  const months = Math.round((years || 0) * 12);
  let balance = principal || 0;
  let activeRate = null;
  let payment = 0;
  let totalInterest = 0;

  const rows = [];

  if (balance <= 0 || months <= 0) {
    return { rows, totalInterest, totalPayment: 0 };
  }

  for (let month = 1; month <= months && balance > 0.5; month++) {
    const stage = stageAt(type, month, cfg);
    const rate = stage.rate;
    if (rate !== activeRate) {
      payment = installment(balance, rate, months - month + 1);
      activeRate = rate;
    }

    const interest = balance * rate / 1200;
    const principalPaid = Math.min(balance, Math.max(0, payment - interest));

    balance -= principalPaid;
    totalInterest += interest;

    rows.push({
      month,
      rate,
      stage: stage.label,
      stageKey: stage.key,
      payment: payment + monthlyFee,
      principalPaid,
      interest,
      balance: Math.max(0, balance)
    });
  }

  return {
    rows,
    totalInterest,
    totalPayment: rows.reduce((sum, r) => sum + r.payment, 0)
  };
}

/**
 * Splits both schedules into periods where neither the old nor the new installment changes,
 * so step-up schemes can be compared tier by tier.
 */
export function comparePeriods(oldRows, newRows) {
  const periods = [];
  const maxMonths = Math.max(oldRows.length, newRows.length);
  const side = (row) => row ? { rate: row.rate, stage: row.stage, payment: row.payment } : null;
  const keyOf = (row) => row ? `${row.stageKey}|${row.rate}|${Math.round(row.payment)}` : "-";

  for (let i = 0; i < maxMonths; i++) {
    const o = oldRows[i];
    const n = newRows[i];
    const key = `${keyOf(o)}#${keyOf(n)}`;
    const saving = (o?.payment || 0) - (n?.payment || 0);
    const last = periods[periods.length - 1];

    if (last && last.key === key) {
      last.endMonth = i + 1;
      last.periodSaving += saving;
    } else {
      periods.push({
        key,
        startMonth: i + 1,
        endMonth: i + 1,
        old: side(o),
        newer: side(n),
        monthlySaving: saving,
        periodSaving: saving
      });
    }
  }

  return periods.map(({ key, ...p }) => ({ ...p, label: periodLabel(p.startMonth, p.endMonth) }));
}
