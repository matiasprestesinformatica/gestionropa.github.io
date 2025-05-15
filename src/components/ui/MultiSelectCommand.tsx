
'use client';

import * as React from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface MultiSelectItem {
  value: string; // Typically the ID
  label: string; // Display name
  icon?: React.ElementType; // Optional icon
}

interface MultiSelectCommandProps {
  options: MultiSelectItem[];
  selectedValues: string[];
  onSelectedValuesChange: (newSelectedValues: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyResultText?: string;
  className?: string;
}

export function MultiSelectCommand({
  options,
  selectedValues,
  onSelectedValuesChange,
  placeholder = "Selecciona opciones...",
  searchPlaceholder = "Buscar opciones...",
  emptyResultText = "No se encontraron opciones.",
  className,
}: MultiSelectCommandProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectedValuesChange(newSelected);
  };

  const handleRemove = (value: string) => {
    onSelectedValuesChange(selectedValues.filter((v) => v !== value));
  };

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-auto min-h-10 py-1.5"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.length > 0
            ? selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="rounded-sm px-2 py-0.5 text-xs"
                >
                  {option.label}
                  <button
                    aria-label={`Eliminar ${option.label}`}
                    onMouseDown={(e) => e.preventDefault()} // Prevent popover close on click
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent popover toggle
                      handleRemove(option.value);
                    }}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            : <span className="text-muted-foreground text-sm">{placeholder}</span>}
        </div>
        {/* <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandInput ref={inputRef} placeholder={searchPlaceholder} />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>{emptyResultText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label} // CommandInput searches based on this
                      onSelect={() => {
                        handleSelect(option.value);
                        // Optional: keep focus on input after selection
                        // inputRef.current?.focus(); 
                      }}
                      className={cn("flex items-center justify-between cursor-pointer", isSelected ? "font-medium" : "")}
                    >
                      <div className="flex items-center">
                        {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                        {option.label}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
