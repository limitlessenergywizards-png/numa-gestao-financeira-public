'use client';


import React from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils'; // You might need to adjust this import based on where formatCurrency is

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: string | number;
    onChange: (value: string) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        // Format the value for display
        const displayValue = typeof value === 'number'
            ? formatCurrency(value)
            : value;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let inputValue = e.target.value;

            // Remove non-numeric characters
            const numericValue = inputValue.replace(/\D/g, '');

            // Convert to currency format (divide by 100 for cents)
            const floatValue = parseFloat(numericValue) / 100;

            // If it's NaN (empty), pass empty string, else pass formatted currency
            if (isNaN(floatValue)) {
                onChange('');
            } else {
                // We initiate the change with the raw number or formatted string? 
                // Usually components expect the parent to handle state. 
                // Let's assume the parent expects a formatted string "R$ 1.234,56" or just the raw value.
                // The NewDebtDialog seems to use parseCurrencyValue, implying it expects the formatted string.

                const formatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(floatValue);

                onChange(formatted);
            }
        };

        return (
            <Input
                {...props}
                ref={ref}
                value={displayValue}
                onChange={handleChange}
                className={className}
            />
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";
