import React from 'react';
import { Card } from "../ui/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ReferenceLine } from "recharts";
import { idr, formatCompact } from "../../utils/format";

export function SensitivityAnalysis({ result }) {
  if (!result.sensitivity || result.sensitivity.length === 0) {
    return null;
  }

  return (
    <Card title="Analisis Sensitivitas Suku Bunga">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Menunjukkan proyeksi NPV penghematan jika suku bunga floating / sisa tenor pada bank baru berfluktuasi (±2% dari asumsi awal). Bar biru menandakan skenario saat ini.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={result.sensitivity} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="testRate" 
              tickFormatter={(val) => `${val}%`}
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Asumsi Suku Bunga Floating', position: 'bottom', fill: '#64748b', fontSize: 12, offset: 0 }}
            />
            <YAxis tickFormatter={formatCompact} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={60} />
            <RechartsTooltip 
              formatter={(value) => idr.format(value)}
              labelFormatter={(label) => `Bunga Floating: ${label}%`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: 'transparent' }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Bar dataKey="testNpv" name="NPV Penghematan" radius={[4, 4, 0, 0]}>
              {result.sensitivity.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isCurrent ? "#4f46e5" : entry.testNpv >= 0 ? "#94a3b8" : "#f43f5e"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
