import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card } from "../ui/Card";
import { idr, formatCompact } from "../../utils/format";

export function BalanceChart({ chartData }) {
  return (
    <Card title="Perbandingan Sisa Pokok">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompact} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={60} />
            <Tooltip 
              formatter={(value) => idr.format(value)}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-white, #fff)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line dataKey="lama" name="Bank lama" stroke="#64748b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line dataKey="baru" name="Bank baru" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
