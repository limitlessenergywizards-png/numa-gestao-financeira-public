'use client';

import React, { useState } from "react";
import { Search } from "lucide-react";
import { helpArticles } from "../data/help-content";
import { useRouter } from "next/navigation";
import { SUPPORT_ROUTES, buildRoute } from "@/lib/routes";
import { motion, AnimatePresence } from "framer-motion";

export const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const filteredArticles = helpArticles.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="relative w-full max-w-2xl mx-auto z-50">
            <div className={`relative flex items-center bg-card border transition-[border-color,box-shadow] duration-300 rounded-2xl overflow-hidden shadow-sm ${isOpen ? 'border-brand ring-2 ring-brand/20' : 'border-border/60 hover:border-brand/40'}`}>
                <Search className="ml-5 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Como posso ajudar? (ex: conciliação, dre, lançamentos)"
                    className="w-full bg-transparent border-none py-4.5 px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 text-lg font-medium"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => query.length > 0 && setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
            </div>

            <AnimatePresence>
                {isOpen && filteredArticles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden shadow-brand/10"
                    >
                        <div className="py-2">
                            {filteredArticles.map(article => (
                                <button
                                    key={article.id}
                                    onClick={() => {
                                        router.push(buildRoute(SUPPORT_ROUTES.MANUAL_ARTICLE, article.id));
                                        setQuery("");
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors flex items-start gap-4 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                                        <article.icon className="h-5 w-5 text-brand group-hover:text-white mt-1" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-foreground font-bold group-hover:text-brand transition-colors text-base">{article.title}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 font-medium">{article.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isOpen && filteredArticles.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-card border border-border/60 rounded-2xl shadow-2xl p-6 text-center text-muted-foreground font-medium">
                    Nenhum resultado encontrado para "<span className="text-foreground font-bold">{query}</span>"
                </div>
            )}
        </div>
    );
};
