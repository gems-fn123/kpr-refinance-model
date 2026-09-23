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

/**
 * Determines the interest rate for a specific month based on the chosen scheme.
 * @param {string} type - The scheme type ('step', 'fixedFloating', or 'full').
 * @param {number} month - The current month number (1-indexed).
 * @param {object} cfg - The configuration object for the chosen scheme.
 * @returns {number} The interest rate for that month.
 */
export function rateAt(type, month, cfg) {
  if (type === "step") {
    const year = Math.ceil(month / 12);
    if (year <= (cfg.step1Years || 0)) return cfg.step1Rate || 0;
    if (year <= (cfg.step1Years || 0) + (cfg.step2Years || 0)) return cfg.step2Rate || 0;
    return cfg.step3Rate || 0;
  }
  if (type === "fixedFloating") {
    return month <= (cfg.fixedYears || 0) * 12 ? (cfg.fixedRate || 0) : (cfg.floatingRate || 0);
  }
  return cfg.fullFixedRate || 0;
}

/**
 * Generates an amortization schedule for a loan.
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
    const rate = rateAt(type, month, cfg);
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
