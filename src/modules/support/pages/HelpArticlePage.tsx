'use client';

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { HelpLayout } from "../components/HelpLayout";
import { ArticleViewer } from "../components/ArticleViewer";
import { helpArticles } from "../data/help-content";

import { SUPPORT_ROUTES } from "@/lib/routes";

const HelpArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const article = helpArticles.find(a => a.id === id);

    useEffect(() => {
        if (!article) {
            // navigate("/manual"); // Should probably redirect or show 404
        }
        window.scrollTo(0, 0);
    }, [article, router]);

    if (!article) {
        return (
            <HelpLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">Artigo não encontrado</h1>
                        <p className="text-neutral-400">O artigo que você procura não existe ou foi movido.</p>
                        <button onClick={() => router.push(SUPPORT_ROUTES.MANUAL)} className="mt-4 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors">
                            Voltar para o início
                        </button>
                    </div>
                </div>
            </HelpLayout>
        );
    }

    return (
        <HelpLayout>
            <ArticleViewer article={article} />
        </HelpLayout>
    );
};

export default HelpArticlePage;
