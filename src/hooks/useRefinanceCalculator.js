import { useState, useMemo } from "react";
import { schedule, comparePeriods, floatingStartMonth, shiftScheme } from "../utils/mortgage";
import { defaults } from "../constants/defaults";

export function useRefinanceCalculator() {
  const [propertyValue, setPropertyValue] = useState(900000000);
  const [balance, setBalance] = useState(600000000);
  const [remainingYears, setRemainingYears] = useState(15);
  const [oldScheme, setOldScheme] = useState("fixedFloating");
  const [oldCfg, setOldCfg] = useState(defaults.old);
  const [oldMonthlyFee, setOldMonthlyFee] = useState(0);

  // Current loan entered from its origination: "manual" = sisa pokok & tenor diisi langsung, "origination" = dihitung dari awal KPR
  const [oldInputMode, setOldInputMode] = useState("manual");
  const [origPrice, setOrigPrice] = useState(900000000);
  const [dpAmount, setDpAmount] = useState(180000000);
  const [origTenor, setOrigTenor] = useState(20);
  const [elapsedYears, setElapsedYears] = useState(5);
  const [origScheme, setOrigScheme] = useState("fixedFloating");
  const [origCfg, setOrigCfg] = useState(defaults.old);
  const [bankBalance, setBankBalance] = useState(0);
  const [useBankBalance, setUseBankBalance] = useState(true);
  
  const [newYears, setNewYears] = useState(15);
  const [newScheme, setNewScheme] = useState("fixedFloating");
  const [newCfg, setNewCfg] = useState(defaults.newer);
  
  const [penalty, setPenalty] = useState(10);
  const [ltv, setLtv] = useState(80);
  const [adminFee, setAdminFee] = useState(7500000);
  const [provisionPct, setProvisionPct] = useState(1);
  const [notaryFee, setNotaryFee] = useState(6000000);
  const [appraisalFee, setAppraisalFee] = useState(1500000);
  const [insuranceFee, setInsuranceFee] = useState(6000000);
  const [discountRate, setDiscountRate] = useState(6);

  // Replays the original loan up to today to get the current balance, remaining tenor and remaining rate tiers.
  const origination = useMemo(() => {
    const principal = Math.max(0, origPrice - dpAmount);
    const totalMonths = Math.round((origTenor || 0) * 12);
    const full = schedule(principal, origTenor, origScheme, origCfg);
    const elapsedMonths = Math.min(Math.max(0, Math.round((elapsedYears || 0) * 12)), totalMonths);
    const remainingMonths = full.rows.length > elapsedMonths ? totalMonths - elapsedMonths : 0;
    return {
      principal,
      totalMonths,
      elapsedMonths,
      remainingMonths,
      computedBalance: remainingMonths === 0 ? 0 : elapsedMonths === 0 ? principal : full.rows[elapsedMonths - 1].balance,
      firstPayment: full.rows[0]?.payment || 0,
      currentRow: full.rows[elapsedMonths] || null,
      paidInterest: full.rows.slice(0, elapsedMonths).reduce((sum, r) => sum + r.interest, 0),
      cfg: shiftScheme(origScheme, origCfg, elapsedMonths)
    };
  }, [origPrice, dpAmount, origTenor, elapsedYears, origScheme, origCfg]);

  const useBank = oldInputMode === "origination" && bankBalance > 0 && useBankBalance;

  // The current loan as used by every calculation below, whichever way it was entered.
  const oldInput = useMemo(() => oldInputMode === "origination"
    ? {
        balance: useBank ? bankBalance : origination.computedBalance,
        remainingYears: origination.remainingMonths / 12,
        scheme: origScheme,
        cfg: origination.cfg,
        balanceSource: useBank ? "bank" : "computed"
      }
    : { balance, remainingYears, scheme: oldScheme, cfg: oldCfg, balanceSource: "manual" },
  [oldInputMode, useBank, bankBalance, origination, origScheme, balance, remainingYears, oldScheme, oldCfg]);

  const result = useMemo(() => {
    const { balance, remainingYears, scheme: oldScheme, cfg: oldCfg } = oldInput;

    // Current Loan Calculation
    const old = schedule(balance, remainingYears, oldScheme, oldCfg, oldMonthlyFee);
    
    // Process fees and New Loan principal
    const processFees = adminFee + (balance * provisionPct / 100) + notaryFee + appraisalFee + insuranceFee;
    const penaltyCost = balance * penalty / 100;
    const newPrincipal = balance + processFees;
    
    // New Loan Calculation
    const newer = schedule(newPrincipal, newYears, newScheme, newCfg);
    
    const maxLoan = propertyValue * ltv / 100;
    const maxMonths = Math.max(old.rows.length, newer.rows.length);
    
    let cumulative = -penaltyCost;
    let npv = -penaltyCost;
    let breakEven = null;
    const chart = [];
    
    for (let i = 0; i < maxMonths; i++) {
      const saving = (old.rows[i]?.payment || 0) - (newer.rows[i]?.payment || 0);
      cumulative += saving;
      npv += saving / Math.pow(1 + discountRate / 1200, i + 1);
      
      if (breakEven === null && cumulative >= 0) breakEven = i + 1;
      
      if (i % 12 === 0 || i === maxMonths - 1) {
        chart.push({
          year: +(i / 12).toFixed(1),
          lama: old.rows[i]?.balance || 0,
          baru: newer.rows[i]?.balance || 0,
          cumulative
        });
      }
    }
    
    // Calculate NPV for Sensitivity Analysis (varying the floating rate that follows the fixed tiers)
    const generateSensitivity = () => {
      const currentFloating = newCfg.floatingRate || 0;
      const variations = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
      
      return variations.map(diff => {
        const testRate = Math.max(0, Number((currentFloating + diff).toFixed(2)));
        const testCfg = { ...newCfg, floatingRate: testRate };
        const testNewer = schedule(newPrincipal, newYears, newScheme, testCfg);
        
        let testNpv = -penaltyCost;
        for (let i = 0; i < maxMonths; i++) {
          const saving = (old.rows[i]?.payment || 0) - (testNewer.rows[i]?.payment || 0);
          testNpv += saving / Math.pow(1 + discountRate / 1200, i + 1);
        }
        
        return {
          rateOffset: diff,
          testRate,
          testNpv,
          isCurrent: diff === 0
        };
      });
    };

    const sensitivity = newScheme === "fixedFloating" || newScheme === "step" ? generateSensitivity() : [];
    const newFloatingStart = floatingStartMonth(newScheme, newCfg);
    
    return {
      old,
      newer,
      processFees,
      penaltyCost,
      newPrincipal,
      maxLoan,
      eligible: newPrincipal <= maxLoan,
      firstOld: old.rows[0]?.payment || 0,
      firstNew: newer.rows[0]?.payment || 0,
      saving: old.totalPayment - (newer.totalPayment + penaltyCost),
      npv,
      breakEven,
      chart,
      sensitivity,
      // Floating only matters when it starts inside the new tenor; otherwise sensitivity is flat.
      floatingApplies: newFloatingStart <= newer.rows.length,
      newFloatingStart,
      periods: comparePeriods(old.rows, newer.rows),
      oldInput,
      origination
    };
  }, [propertyValue, oldInput, origination, oldMonthlyFee, newYears, newScheme, newCfg, penalty, ltv, adminFee, provisionPct, notaryFee, appraisalFee, insuranceFee, discountRate]);

  const reset = () => {
    setPropertyValue(900000000);
    setBalance(600000000);
    setRemainingYears(15);
    setOldScheme("fixedFloating");
    setOldCfg(defaults.old);
    setOldMonthlyFee(0);
    setOldInputMode("manual");
    setOrigPrice(900000000);
    setDpAmount(180000000);
    setOrigTenor(20);
    setElapsedYears(5);
    setOrigScheme("fixedFloating");
    setOrigCfg(defaults.old);
    setBankBalance(0);
    setUseBankBalance(true);
    setNewYears(15);
    setNewScheme("fixedFloating");
    setNewCfg(defaults.newer);
    setPenalty(10);
    setLtv(80);
  };

  return {
    state: {
      propertyValue, setPropertyValue,
      balance, setBalance,
      remainingYears, setRemainingYears,
      oldScheme, setOldScheme,
      oldCfg, setOldCfg,
      oldMonthlyFee, setOldMonthlyFee,
      oldInputMode, setOldInputMode,
      origPrice, setOrigPrice,
      dpAmount, setDpAmount,
      origTenor, setOrigTenor,
      elapsedYears, setElapsedYears,
      origScheme, setOrigScheme,
      origCfg, setOrigCfg,
      bankBalance, setBankBalance,
      useBankBalance, setUseBankBalance,
      newYears, setNewYears,
      newScheme, setNewScheme,
      newCfg, setNewCfg,
      penalty, setPenalty,
      ltv, setLtv,
      adminFee, setAdminFee,
      provisionPct, setProvisionPct,
      notaryFee, setNotaryFee,
      appraisalFee, setAppraisalFee,
      insuranceFee, setInsuranceFee,
      discountRate, setDiscountRate
    },
    result,
    reset
  };
}
