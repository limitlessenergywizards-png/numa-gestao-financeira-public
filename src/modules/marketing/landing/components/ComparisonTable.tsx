'use client';

import { motion } from "framer-motion";
import { Check, X, DollarSign } from "lucide-react";

const comparisonData = [
  {
    feature: "Painel de inadimplência",
    spreadsheets: false,
    others: false,
    flgestao: true,
  },
  {
    feature: "Alertas automáticos de cobrança",
    spreadsheets: false,
    others: "extra",
    flgestao: true,
  },
  {
    feature: "Score de pagamento por cliente",
    spreadsheets: false,
    others: false,
    flgestao: true,
  },
  {
    feature: "Recomendações de otimização com IA",
    spreadsheets: false,
    others: false,
    flgestao: true,
  },
  {
    feature: "Projeção realista vs otimista",
    spreadsheets: false,
    others: false,
    flgestao: true,
  },
  {
    feature: "DRE automático",
    spreadsheets: false,
    others: true,
    flgestao: true,
  },
  {
    feature: "Multi-empresas sem custo extra",
    spreadsheets: false,
    others: "R$100+",
    flgestao: true,
  },
  {
    feature: "Preço",
    spreadsheets: "grátis",
    others: "R$497+",
    flgestao: "R$197",
  },
];

const ComparisonCell = ({ value }: { value: boolean | string }) => {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
          <Check className="h-5 w-5 text-success" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
          <X className="h-5 w-5 text-destructive" />
        </div>
      </div>
    );
  }
  if (value === "extra") {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-warning">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-medium">Extra</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className={`text-sm font-semibold ${value === "R$197" ? "text-success" : "text-destructive"}`}>
        {value}
      </span>
    </div>
  );
};

export function ComparisonTable() {
  return (
    <section className="py-20 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher a Numa?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare e veja a diferença
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Funcionalidade</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Planilhas</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Outros Sistemas</th>
                  <th className="text-center p-4 font-semibold">
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
                      Numa ✓
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-border/50 last:border-0 ${
                      index % 2 === 0 ? "bg-muted/20" : ""
                    }`}
                  >
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4">
                      <ComparisonCell value={row.spreadsheets} />
                    </td>
                    <td className="p-4">
                      <ComparisonCell value={row.others} />
                    </td>
                    <td className="p-4 bg-brand/5">
                      <ComparisonCell value={row.flgestao} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {comparisonData.map((row, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur"
              >
                <h4 className="font-semibold mb-3">{row.feature}</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Planilhas</p>
                    <ComparisonCell value={row.spreadsheets} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Outros</p>
                    <ComparisonCell value={row.others} />
                  </div>
                  <div className="bg-brand/5 rounded-lg py-1">
                    <p className="text-xs text-brand mb-1">Numa</p>
                    <ComparisonCell value={row.flgestao} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
