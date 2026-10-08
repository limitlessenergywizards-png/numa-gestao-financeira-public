'use client';

import { cn } from "@/lib/utils";

const PREDEFINED_COLORS = [
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Slate", value: "#64748b" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Stone", value: "#78716c" },
  { name: "Lime", value: "#84cc16" },
  { name: "Zinc", value: "#71717a" },
];

interface CategoryColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PREDEFINED_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "w-8 h-8 rounded-full border-2 transition-[transform,box-shadow] hover:scale-110",
            value === color.value
              ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
              : "border-transparent"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { PREDEFINED_COLORS };
