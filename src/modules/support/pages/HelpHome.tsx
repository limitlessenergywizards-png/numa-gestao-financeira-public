
import React from "react";
import { HelpLayout } from "../components/HelpLayout";
import { SearchBar } from "../components/SearchBar";
import { helpCategories, helpArticles } from "../data/help-content";
import Link from "next/link";

import { ArrowRight, Sparkles } from "lucide-react";

const HelpHome: React.FC = () => {
    return (
        <HelpLayout>
            <div className="py-12">
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-6 uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        <span>Central de Conhecimento Numa</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                        Como podemos ajudar?
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Encontre guias, tutoriais e respostas para todas as suas dúvidas sobre o Numa Gestão Financeira.
                    </p>
                    <SearchBar />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpCategories.map((category, index) => (
                        <div
                            key={category.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                        >
                            <div className="h-full group relative rounded-2xl border border-border/40 bg-card p-8 transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand/5 hover:bg-muted/30 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-[transform,background-color,color] duration-300 group-hover:scale-110 shadow-sm shadow-brand/10">
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="mb-3 text-2xl font-bold text-foreground group-hover:text-brand transition-colors">{category.title}</h2>

                                    <ul className="space-y-3 mb-8">
                                        {helpArticles.filter(a => a.category === category.id).slice(0, 3).map(article => (
                                            <li key={article.id}>
                                                <Link href={`/manual/artigo/${article.id}`} className="text-sm font-medium text-muted-foreground hover:text-brand transition-colors flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-brand/30 group-hover:bg-brand/50 transition-colors" />
                                                    {article.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={`/manual/artigo/${helpArticles.find(a => a.category === category.id)?.id || ''}`}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-brand/70 hover:text-brand transition-[color,transform] group-hover:translate-x-1"
                                    >
                                        Ver todos
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </HelpLayout>
    );
};

export default HelpHome;
