import React from "react";
import { useRefinanceCalculator } from "./hooks/useRefinanceCalculator";
import { idr } from "./utils/format";

// Layout
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Forms
import { CurrentMortgageForm } from "./components/forms/CurrentMortgageForm";
import { NewMortgageForm } from "./components/forms/NewMortgageForm";
import { RefinancingCostsForm } from "./components/forms/RefinancingCostsForm";

// Results
import { VerdictBanner } from "./components/results/VerdictBanner";
import { MetricsGrid } from "./components/results/MetricsGrid";
import { BalanceChart } from "./components/results/BalanceChart";
import { SavingsChart } from "./components/results/SavingsChart";
import { SummaryTable } from "./components/results/SummaryTable";
import { AmortizationTable } from "./components/results/AmortizationTable";
import { SensitivityAnalysis } from "./components/results/SensitivityAnalysis";

export default function App() {
  const calculator = useRefinanceCalculator();
  const { state, result, reset } = calculator;

  const handleShare = async () => {
    const text = `Simulasi Refinance KPR\n\nHasil: ${result.eligible && result.npv > 0 ? "Layak Refinance" : "Pertahankan KPR Lama"}\nPenghematan NPV: ${idr.format(result.npv)}\nBreak-even: ${result.breakEven ? result.breakEven + " bulan" : "Tidak tercapai"}\n\nDihitung menggunakan KPR Refinance Calculator`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hasil KPR Refinance', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Hasil berhasil disalin ke clipboard!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-200 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-100">
      <Header onReset={reset} onShare={handleShare} />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-5 py-6 lg:py-8 print:p-0 print:m-0 print:bg-white print:text-black">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr] xl:grid-cols-[430px_1fr] items-start">
          
          <div className="space-y-6 print:hidden">
            <CurrentMortgageForm state={state} />
            <NewMortgageForm state={state} />
            <RefinancingCostsForm state={state} />
          </div>

          <div className="space-y-6">
            <VerdictBanner result={result} />
            <MetricsGrid result={result} />
            
            <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 print:break-inside-avoid print:gap-4">
              <BalanceChart chartData={result.chart} />
              <SavingsChart chartData={result.chart} />
            </div>

            <SummaryTable result={result} />
            <SensitivityAnalysis result={result} />
            
            <div className="print:hidden">
              <AmortizationTable result={result} />
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
