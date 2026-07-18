"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Thin wrapper over the base-ui Select primitives for the common case: a
 * controlled single-value select driven by an options array. Keeps filter
 * bars and forms free of primitive boilerplate.
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar…",
  className,
  size = "default",
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(String(next))} disabled={disabled}>
      <SelectTrigger size={size} className={className}>
        <SelectValue placeholder={placeholder}>
          {(selected: string) =>
            options.find((option) => option.value === selected)?.label ?? placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
