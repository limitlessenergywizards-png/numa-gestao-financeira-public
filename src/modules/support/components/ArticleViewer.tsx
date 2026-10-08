
import React from "react";
import { HelpArticle, HelpSection } from "../data/help-content";
import { StepGuide, ProTip, WarningBlock } from "./DocComponents";


interface ArticleViewerProps {
    article: HelpArticle;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({ article }) => {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="animate-fade-in">
                <div className="mb-8 border-b border-border/40 pb-8">
                    <div className="flex items-center gap-3 mb-4 text-brand">
                        <article.icon className="h-8 w-8" />
                        <span className="text-sm font-bold uppercase tracking-widest text-brand/80">{article.category}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">{article.title}</h1>
                    <p className="text-xl text-muted-foreground leading-relaxed font-medium">{article.description}</p>
                </div>

                <div className="space-y-10">
                    {article.content.map((section, index) => (
                        <RenderSection key={index} section={section} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const RenderSection: React.FC<{ section: HelpSection }> = ({ section }) => {
    switch (section.type) {
        case "text":
            return (
                <div className="prose dark:prose-invert max-w-none">
                    {section.title && <h2 className="text-2xl font-bold text-foreground mb-6 mt-10 tracking-tight">{section.title}</h2>}
                    <p className="text-foreground/80 leading-8 whitespace-pre-line text-lg font-medium">{section.content}</p>
                </div>
            );
        case "step-guide":
            return <StepGuide steps={section.content} title={section.title} />;
        case "pro-tip":
            return <ProTip content={section.content} />;
        case "warning":
            return <WarningBlock content={section.content} />;
        case "image":
            return (
                <div className="my-10 rounded-2xl overflow-hidden border border-border/40 shadow-2xl transition-transform hover:scale-[1.01]">
                    {section.title && <div className="bg-muted px-6 py-3 border-b border-border/40 text-sm font-bold text-muted-foreground uppercase tracking-wider">{section.title}</div>}
                    <div className="bg-muted/30 p-2">
                        <img src={section.content} alt={section.title || "Help image"} className="w-full h-auto object-cover rounded-lg" />
                    </div>
                </div>
            )
        default:
            return null;
    }
};
