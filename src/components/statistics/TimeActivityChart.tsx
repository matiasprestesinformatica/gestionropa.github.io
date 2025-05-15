
// src/components/statistics/TimeActivityChart.tsx
'use client';

import * as React from 'react';
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeActivityStat } from '@/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface TimeActivityChartProps {
  data: TimeActivityStat[];
  isLoading?: boolean;
  error?: string | null;
  chartType?: 'line' | 'bar';
}

export function TimeActivityChart({ data, isLoading, error, chartType = 'bar' }: TimeActivityChartProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando actividad en el tiempo...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-64 text-destructive">{error}</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay suficientes datos de actividad para mostrar el gráfico.
      </div>
    );
  }
  
  const chartConfig = {
    count: {
      label: "Asignaciones",
      color: "hsl(var(--chart-1))",
    },
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={300}>
            <ChartComponent
                data={data}
                margin={{
                    top: 5,
                    right: 20,
                    left: 0,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Legend verticalAlign="top" height={36} />
                 <DataComponent
                    dataKey="count"
                    type="monotone"
                    name="Asignaciones"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    strokeWidth={chartType === 'line' ? 2 : undefined}
                    dot={chartType === 'line' ? { r: 4, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))' } : undefined}
                    radius={chartType === 'bar' ? [4, 4, 0, 0] : undefined}
                />
            </ChartComponent>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
