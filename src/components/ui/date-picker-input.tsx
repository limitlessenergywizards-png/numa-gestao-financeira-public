'use client';

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerInputProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    minDate?: Date;
    maxDate?: Date;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePickerInput({
    value,
    onChange,
    minDate,
    maxDate,
    placeholder = "DD/MM/AAAA",
    className,
    disabled = false,
}: DatePickerInputProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>("");

    // Sync state when value changes externally
    React.useEffect(() => {
        if (value && isValid(value)) {
            setInputValue(format(value, "dd/MM/yyyy"));
        } else {
            setInputValue("");
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let text = e.target.value.replace(/\D/g, ""); // Remove non-digits

        // Auto-formatting DD/MM/YYYY
        if (text.length > 8) text = text.slice(0, 8);
        if (text.length > 4) {
            text = `${text.slice(0, 2)}/${text.slice(2, 4)}/${text.slice(4)}`;
        } else if (text.length > 2) {
            text = `${text.slice(0, 2)}/${text.slice(2)}`;
        }

        setInputValue(text);

        // Try parsing if full date is typed
        if (text.length === 10) {
            const parsedDate = parse(text, "dd/MM/yyyy", new Date());
            if (isValid(parsedDate)) {
                // Optional bounding
                if (minDate && parsedDate < minDate) return;
                if (maxDate && parsedDate > maxDate) return;

                onChange?.(parsedDate);
                setIsOpen(false);
            }
        } else if (text.length === 0) {
            onChange?.(undefined);
        }
    };

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            setInputValue(format(date, "dd/MM/yyyy"));
            onChange?.(date);
            setIsOpen(false);
        } else {
            setInputValue("");
            onChange?.(undefined);
        }
    };

    // Extract year window dynamically or default
    const currentYear = new Date().getFullYear();
    const fromYear = minDate ? minDate.getFullYear() : currentYear - 10;
    const toYear = maxDate ? maxDate.getFullYear() : currentYear + 10;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div className={cn("relative", className)}>
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "pl-9 w-full min-w-[130px] font-normal transition-colors cursor-text group-hover:border-primary/50 text-sm h-9",
                        !value && "text-muted-foreground"
                    )}
                />
                <PopoverTrigger asChild>
                    <div
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex justify-center items-center text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 cursor-pointer"
                        aria-label="Open calendar"
                        aria-disabled={disabled}
                    >
                        <CalendarIcon className="h-4 w-4 opacity-0" /> {/* Invisible, used for hit area */}
                    </div>
                </PopoverTrigger>
            </div>

            <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    defaultMonth={value || new Date()}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={fromYear}
                    toYear={toYear}
                />
            </PopoverContent>
        </Popover>
    );
}
