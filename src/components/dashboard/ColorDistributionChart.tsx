
// src/components/dashboard/ColorDistributionChart.tsx
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ColorFrequency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ColorDistributionChartProps {
  data: ColorFrequency[];
}

export function ColorDistributionChart({ data }: ColorDistributionChartProps) {
  if (!data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay datos de color para mostrar.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="color"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} prendas`, name]}
          wrapperStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", padding: "0.5rem" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
