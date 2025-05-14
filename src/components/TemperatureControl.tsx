'use client';

import * as React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer } from 'lucide-react';

interface TemperatureControlProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function TemperatureControl({
  value,
  onChange,
  min = -20,
  max = 40,
  step = 1,
}: TemperatureControlProps) {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = (newVal: [number, number]) => {
    setLocalValue(newVal);
  };
  
  const handleCommit = (committedVal: [number, number]) => {
    onChange(committedVal);
  };


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Thermometer className="mr-2 h-6 w-6 text-primary" />
          Control de Temperatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>{localValue[0]}°C</span>
            <span>{localValue[1]}°C</span>
          </div>
          <Slider
            value={localValue}
            onValueChange={handleValueChange}
            onValueCommit={handleCommit}
            min={min}
            max={max}
            step={step}
            aria-label="Temperature range slider"
            className="[&>.slider-thumb]:bg-primary [&>.slider-range]:bg-primary/80"
          />
          <Label htmlFor="temperature-slider" className="sr-only">
            Rango de Temperatura (°C)
          </Label>
          <p className="text-xs text-muted-foreground text-center">
            Desliza para seleccionar el rango de temperatura deseado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
