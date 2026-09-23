import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from "recharts";
import { Card } from "../ui/Card";
import { idr, formatCompact } from "../../utils/format";

export function SavingsChart({ chartData }) {
  return (
    <Card title="Akumulasi Penghematan">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompact} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={60} />
            <Tooltip 
              formatter={(value) => idr.format(value)}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: 'transparent' }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Bar dataKey="cumulative" name="Akumulasi Penghematan" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cumulative >= 0 ? "#10b981" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
