
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronRight, Lightbulb, AlertTriangle, Info } from "lucide-react";
import React from "react";


// --- Types ---
interface StepGuideProps {
    steps: { title: string; description: string }[];
    title?: string;
}

interface ProTipProps {
    content: string;
}

interface WarningProps {
    content: string;
}

// --- Components ---

export const StepGuide: React.FC<StepGuideProps> = ({ steps, title }) => {
    return (
        <div className="my-10 rounded-2xl border border-border/40 bg-card/50 p-8 backdrop-blur-xl shadow-sm">
            {title && <h3 className="mb-8 text-xl font-bold text-foreground flex items-center gap-3 tracking-tight"><CheckCircle2 className="h-6 w-6 text-brand" /> {title}</h3>}
            <div className="space-y-0 relative">
                {/* Vertical connector line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand/40 to-transparent" />

                {steps.map((step, index) => (
                    <div key={index} className="relative flex gap-6 pb-10 last:pb-0 group">
                        <div className="flex-none relative z-10">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background shadow-md shadow-brand/5 ring-4 ring-background transition-[transform,border-color,box-shadow] duration-300 group-hover:border-brand/40 group-hover:scale-110 group-hover:shadow-brand/20">
                                <span className="text-sm font-bold text-brand">{index + 1}</span>
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-lg font-bold text-foreground group-hover:text-brand transition-colors tracking-tight">{step.title}</h4>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-medium">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ProTip: React.FC<ProTipProps> = ({ content }) => {
    return (
        <div className="my-8 flex gap-4 rounded-xl border border-success/20 bg-success/5 p-5 text-sm text-foreground/80 shadow-sm backdrop-blur-sm font-medium">
            <Lightbulb className="h-6 w-6 shrink-0 text-success" />
            <div className="flex-1">
                <span className="font-bold block mb-1 text-success uppercase tracking-wider text-xs">Dica Pro</span>
                {content}
            </div>
        </div>
    );
};

export const WarningBlock: React.FC<WarningProps> = ({ content }) => {
    return (
        <div className="my-8 flex gap-4 rounded-xl border border-warning/20 bg-warning/5 p-5 text-sm text-foreground/80 shadow-sm backdrop-blur-sm font-medium">
            <AlertTriangle className="h-6 w-6 shrink-0 text-warning" />
            <div className="flex-1">
                <span className="font-bold block mb-1 text-warning uppercase tracking-wider text-xs">Atenção</span>
                {content}
            </div>
        </div>
    );
};
