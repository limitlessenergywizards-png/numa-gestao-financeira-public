'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { helpCategories, helpArticles } from "../data/help-content";
import { ChevronRight, Book, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_ROUTES, MAIN_ROUTES } from "@/lib/routes";

interface HelpLayoutProps {
    children: React.ReactNode;
}

export const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const isArticlePage = pathname.includes("/artigo/");

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 dark:bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row min-h-screen max-w-[1600px] mx-auto">
                {/* Sidebar Navigation */}
                <aside className="hidden md:block w-64 lg:w-72 border-r border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto pt-24 pb-10 px-6">
                    <div className="mb-8">
                        <Link href={SUPPORT_ROUTES.MANUAL} className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight mb-6">
                            <Book className="h-6 w-6" />
                            <span>Manual do Sistema</span>
                        </Link>
                        <Link href={MAIN_ROUTES.HOME} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao Sistema
                        </Link>
                    </div>

                    <nav className="space-y-8">
                        {helpCategories.map((category) => (
                            <div key={category.id}>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                                    <category.icon className="h-3 w-3" />
                                    {category.title}
                                </h3>
                                <ul className="space-y-1">
                                    {helpArticles
                                        .filter((article) => article.category === category.id)
                                        .map((article) => (
                                            <li key={article.id}>
                                                <Link
                                                    href={`${SUPPORT_ROUTES.MANUAL_ARTICLE}/${article.id}`}
                                                    className={cn(
                                                        "block px-3 py-2 rounded-lg text-sm transition-colors duration-200 group flex items-center justify-between",
                                                        pathname.includes(article.id)
                                                            ? "bg-brand/10 text-brand font-semibold"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    {article.title}
                                                    {pathname.includes(article.id) && <ChevronRight className="h-3 w-3 text-primary" />}
                                                </Link>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {/* Mobile Header */}
                    <header className="md:hidden h-16 border-b border-border/40 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                        <Link href={SUPPORT_ROUTES.MANUAL} className="font-bold text-lg text-foreground">Manual</Link>
                        <Link href={MAIN_ROUTES.HOME} className="text-sm text-muted-foreground font-medium">Voltar</Link>
                    </header>

                    <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
