import React from 'react';
import { Metric } from "../ui/Metric";
import { idr } from "../../utils/format";

export function MetricsGrid({ result }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metric label="Cicilan awal lama" value={idr.format(result.firstOld)} />
      <Metric label="Cicilan awal baru" value={idr.format(result.firstNew)} />
      <Metric 
        label="Selisih cicilan awal" 
        value={idr.format(result.firstOld - result.firstNew)} 
        good={result.firstOld > result.firstNew} 
      />
      <Metric 
        label="Penghematan total" 
        value={idr.format(result.saving)} 
        good={result.saving > 0} 
        info="Selisih total pembayaran lama dikurangi total pembayaran baru beserta penaltinya."
      />
    </div>
  );
}
