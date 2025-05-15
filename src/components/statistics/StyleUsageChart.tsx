
// src/components/statistics/StyleUsageChart.tsx
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StyleUsageStat } from '@/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; // Using ShadCN's Chart components

interface StyleUsageChartProps {
  data: StyleUsageStat[];
  isLoading?: boolean;
  error?: string | null;
}

export function StyleUsageChart({ data, isLoading, error }: StyleUsageChartProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando datos de estilos...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-64 text-destructive">{error}</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay suficientes datos de uso de estilos para mostrar el gráfico.
      </div>
    );
  }

  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill || 'hsl(var(--chart-1))' };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="value" name="Prendas" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
