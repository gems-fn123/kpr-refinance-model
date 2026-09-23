import { useState, useMemo } from "react";
import { schedule } from "../utils/mortgage";
import { defaults } from "../constants/defaults";

export function useRefinanceCalculator() {
  const [propertyValue, setPropertyValue] = useState(900000000);
  const [balance, setBalance] = useState(600000000);
  const [remainingYears, setRemainingYears] = useState(15);
  const [oldScheme, setOldScheme] = useState("fixedFloating");
  const [oldCfg, setOldCfg] = useState(defaults.old);
  const [oldMonthlyFee, setOldMonthlyFee] = useState(0);
  
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

  const result = useMemo(() => {
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
    
    // Calculate NPV for Sensitivity Analysis (Varying floating/terminal rates)
    const generateSensitivity = () => {
      const isStep = newScheme === "step";
      const currentFloating = isStep ? (newCfg.step3Rate || 10.5) : (newCfg.floatingRate || 11);
      const variations = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
      
      return variations.map(diff => {
        const testRate = Math.max(0, Number((currentFloating + diff).toFixed(2)));
        const testCfg = isStep 
          ? { ...newCfg, step3Rate: testRate }
          : { ...newCfg, floatingRate: testRate };
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
      sensitivity
    };
  }, [propertyValue, balance, remainingYears, oldScheme, oldCfg, oldMonthlyFee, newYears, newScheme, newCfg, penalty, ltv, adminFee, provisionPct, notaryFee, appraisalFee, insuranceFee, discountRate]);

  const reset = () => {
    setPropertyValue(900000000);
    setBalance(600000000);
    setRemainingYears(15);
    setOldScheme("fixedFloating");
    setOldCfg(defaults.old);
    setOldMonthlyFee(0);
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
